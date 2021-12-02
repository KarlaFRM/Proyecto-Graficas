//Proyecto final para la material Graficas Computacionales
//Cloth simulation
//Autor: Karla Fabiola Ramirez Martinez

//Variables globales-------------------------------------------
//Camara
var camera, scene, renderer,geoCloth,sphere,object;
//Variables para las particulas de la tela
var n, longCloth, particles, particle, pt, constrains, constrainvar, updatePos;
//Luz
	var light, materials;
//Tiempo
let duration = 5000;
let currentTime = Date.now();
//Variables que afectan la tela
//Velocidad con la que cae, mientras menor sea mas rapido cae
var DAMPING = 0.05; //En 0.003 cae acceleration velocidad normal
var DRAG = 1 - DAMPING;
//Tamaño
var tamaño = 20;//1:1
var xVar =40; //
var yVar = 25; //
var clothFunction = plane( tamaño * xVar, tamaño * yVar );
var cloth = new Cloth( xVar , yVar );
var GRAVITY =-( 981 * 1.2); //
//Solo afecta en el axis y
var gravity = new THREE.Vector3( 0,  GRAVITY, 0 ).multiplyScalar( 1 );
var TIMESTEP = 18 / 1000;
var TIMESTEP_SQ = TIMESTEP * TIMESTEP;
//Esfera
var sphereCoor = new THREE.Vector3( 0, 0, 0 );
var sphereSize =80
var tmpForce = new THREE.Vector3();
//Variable para inicializar
var lastTime;
//Variables de plano
var x,y,x;
//Esta funcion crea el plano donde se encuentra
function plane( width, height ) {
	return function( unit, vect ) {
		x = ( unit - 0.5 ) * width;
		y = ( vect + 0.5 ) * height;
	  z = 0;
		return new THREE.Vector3( x, y, z );
	};

}
//Mueve las particulas de la tela
function Particle( x, y, z, mass ) {

	this.position = clothFunction( x, y, z); // posicion actual
	this.old = clothFunction( x, y, z); // old
	this.original = clothFunction( 0, y, -200);//posicion inicial
	this.acceleration = new THREE.Vector3( 0, 0, 0 ); // aceleracion
	this.mass = mass;//masa
	this.invMass = 1 / mass;//inverso
	this.constant = new THREE.Vector3();
	this.constant2 = new THREE.Vector3();

}

//Añade los efectos de fuerzas externas la tela
Particle.prototype.addForce = function( extForce ) {
	this.acceleration.add(
		//Pone la fuerza que se le aplica con la inversa de la masa
		this.constant2.copy( extForce ).multiplyScalar( this.invMass )
	);

};
// Aqui se hace la integracion (Se hace de cada particula :)
Particle.prototype.integrate = function( timeParticle ) {
	//Toma la posicion anterior y la posicion actual
	updatePos = this.constant.subVectors( this.position, this.old );
	updatePos.multiplyScalar( DRAG ).add( this.position );
	updatePos.add( this.acceleration.multiplyScalar( timeParticle ) );

	//despues de actualizar actualiza las variables
	this.constant = this.old;
	this.old = this.position;
	//console.log(this.old)
	this.position = updatePos;

	this.acceleration.set( 0, 0, 0 );

};
//En esta parte checa que los constrains funcionen y se actualicen
var differencial = new THREE.Vector3();
function satisifyConstrains( position1, position2, distance ) {
	differencial.subVectors( position2.position, position1.position );
	var correctionHalf = differencial.multiplyScalar( 1 - distance / differencial.length() ).multiplyScalar( 0.5 );
	position1.position.add( correctionHalf );
	position2.position.sub( correctionHalf );
}

//Crea la tela que utilizaremos con particulas
function Cloth( width, heigth ) {
	this.width = width;
	this.heigth = heigth;

	particles = [];
	constrains = [];

	var unit, vect ;

	// Crea las particulas de la tela
	//Recorre ambos x,y
	for ( vect = 0; vect <= heigth; vect ++ ) {
		for ( unit = 0; unit <= width; unit ++ ) {
			particles.push(
				//X,Y,Z
				//1/ancho ,  1/largo , z , masa
				new Particle( (unit) / (width), (vect*.8) / (heigth), 0, 1.2 )
			);

		}

	}
	//Para los constrains de la tela
	for ( vect = 0; vect < heigth; vect ++ ) {
		for ( unit = 0; unit < width; unit ++ ) {
			constrains.push( [particles[ index( unit, vect ) ],particles[ index( unit, vect + 1 ) ],tamaño] );
			constrains.push( [particles[ index( unit, vect ) ],particles[ index( unit + 1, vect ) ],tamaño] );
		}

	}
	// para la variable unit que recorre la altura
	for ( unit = width, vect = 0; vect < heigth; vect ++ ) {
		constrains.push( [particles[ index( unit, vect ) ],particles[ index( unit, vect + 1 ) ],tamaño] );

	}
	//Para la variable vect que recorre lo ancho
	for ( vect = heigth, unit = 0; unit < width; unit ++ ) {
		constrains.push( [particles[ index( unit, vect ) ],particles[ index( unit + 1, vect ) ],tamaño] );
	}
	this.particles = particles;
	this.constrains = constrains;

//Para saber en que parte se encuentra
	function index( unit, vect ) {
		return unit + vect * ( width + 1 );
	}
	this.index = index;
}

//Los movimientos realizados
function movements( time ) {
	//basicamente dice que hay un Tiempo
	if ( ! lastTime ) {
		lastTime = time;
		return;
	}

	//Realiza la integracion con cada particula
	for ( particles = cloth.particles, n = 0, longCloth = particles.length; n < longCloth; n ++ ) {
		//Cambia cada particula
		particle = particles[ n ];
		//Añade la gravedad e integra(segun el tiempo)
		particle.addForce( gravity );
		particle.integrate( TIMESTEP_SQ );
	}

	//Limites de las figuras
	constrains = cloth.constrains,
	longCloth = constrains.length;
	for ( n = 0; n < longCloth; n ++ ) {
		constrain = constrains[ n ];
		satisifyConstrains( constrain[ 0 ], constrain[ 1 ], constrain[ 2 ] );
	}

	//Limites de la esfera
	sphereCoor.z = 0;
	sphereCoor.x = 0;
	sphereCoor.y = -45;//radio de la esfera - 2


	for ( particles = cloth.particles, n = 0, longCloth = particles.length
			; n < longCloth; n ++ ) {

		particle = particles[ n ];
		pos = particle.position;
		differencial.subVectors( pos, sphereCoor );
		if ( differencial.length() < sphereSize ) {
			//Checa si colisiona con la esfera o no
			differencial.normalize().multiplyScalar( sphereSize );
			pos.copy( sphereCoor ).add( differencial );
		}

	}

	// Limites del suelo :)
	for ( particles = cloth.particles, n = 0, longCloth = particles.length
			; n < longCloth; n ++ ) {
		particle = particles[ n ];
		pos = particle.position;
		pos.z+=0.001;
		//mueve la tela :)

		if ( pos.y < - 250 ) {
			pos.z = 100;
			pos.y = - 250;
		}
	}

}
//THREE.ImageUtils.crossOrigin = '';

//Convierte radianes acceleration grados
Math.radians = function(degrees) {
  return degrees * Math.PI / 180;
};
//Convierte grados acceleration radianes
Math.degrees = function(radians) {
  return radians * 180 / Math.PI;
};
//Este es el main
function main() {
				//Canvas
				canvas = $('#canvas-wrapper');
				// Escena
				scene = new THREE.Scene();
				scene.fog = new THREE.Fog( 0x1e1e1e, 500, 10000 );
				camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 1, 10000 );
				//Pruebas de cambio de camara
				camera.position.y = 500;
				camera.position.z = 800;
				camera.position.x=1000;
				scene.add( camera );
				//addMouseHandler(canvas, scene);

				scene.add( new THREE.AmbientLight( 0x888888 ) );

				light = new THREE.DirectionalLight( 0xdfebff,1.5);

        light.position.set( -1000, 100, 50);
				light.position.multiplyScalar( 1 );
				light.castShadow = true;
				light.shadowMapWidth = 1024;
				light.shadowMapHeight = 1024;



				scene.add( light );
        secondayLight = light;
        light.position.set( 1000, 100, 50);
        scene.add(secondayLight);
        var directionalLightHelper = new THREE.DirectionalLightHelper(light, 20);

				//Material de la tela
        var createClothTexture = function(url){
          var clothTexture = THREE.ImageUtils.loadTexture("/img/tela.png" );
				  clothTexture.wrapS = clothTexture.wrapT = THREE.RepeatWrapping;
          clothTexture.repeat.set(10, 10);
          return clothTexture
        };
				//Se crea el material de la tela
        var createClothMaterial = function(clothTexture){
          var clothMaterial = new THREE.MeshPhongMaterial( {
            map: clothTexture,
            side: THREE.DoubleSide,
            alphaTest: 0.5
          } );
          return clothMaterial
        };

        //Piso
				var groundTexture = THREE.ImageUtils.loadTexture( "/img/floor.png" );
				groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
				groundTexture.repeat.set( 25, 25 );
				groundTexture.anisotropy = 36;

				var groundMaterial = new THREE.MeshPhongMaterial( { map: groundTexture, color: 0xf7f7f7, specular: 0x1e1e1e, shininess: 30, shading: THREE.FlatShading } );
				var mesh = new THREE.Mesh( new THREE.PlaneBufferGeometry( 20000, 20000 ), groundMaterial );
				mesh.position.y = -250;
				mesh.rotation.x = - Math.PI / 2;

				mesh.receiveShadow = true;
        mesh.rog = false;
				scene.add( mesh );


				//Tela
				geoCloth = new THREE.ParametricGeometry( clothFunction, cloth.width, cloth.heigth );
				geoCloth.dynamic = true;
        var initClothTexture = createClothTexture('/img/tela.png');
        var initClothMaterial = createClothMaterial(initClothTexture);
				var uniforms = { texture:  { type: "t", value: initClothTexture } };
				var vertexShader = document.getElementById( 'vertexShaderDepth' ).textContent;
				var fragmentShader = document.getElementById( 'fragmentShaderDepth' ).textContent;

				object = new THREE.Mesh(geoCloth, initClothMaterial );
				object.position.set( 0, 50, 0 );
				scene.add( object );

				object.customDepthMaterial = new THREE.ShaderMaterial( {
					uniforms: uniforms,
				  vertexShader: vertexShader,
					fragmentShader: fragmentShader,
					side: THREE.DoubleSide
				} );

				//Esfera
				var geoSphere = new THREE.SphereGeometry( sphereSize, 20, 20 );
				var matSphere = new THREE.MeshPhongMaterial(  "/img/fondo2.png" );

				sphere = new THREE.Mesh( geoSphere, matSphere );
				scene.add( sphere );

				renderer = new THREE.WebGLRenderer( { antialias: true } );
				renderer.setPixelRatio( window.devicePixelRatio );

				renderer.setSize( canvas.width(), canvas.height());
				renderer.setClearColor( scene.fog.color );

				canvas.append( renderer.domElement );

				renderer.gammaInput = true;
				renderer.gammaOutput = true;


}
function animate() {

  requestAnimationFrame( animate );
  var time = Date.now();
  movements(time);
  render();


}
function render() {

  var timer = Date.now() * 0.0003;
  var position = 0;
  var p = cloth.particles;

  for ( var n = 0, longCloth = p.length; n < longCloth; n ++ ) {

    geoCloth.vertices[ n ].copy( p[ n ].position );

  }
  geoCloth.computeFaceNormals();
  geoCloth.computeVertexNormals();
  geoCloth.normalsNeedUpdate = true;
  geoCloth.verticesNeedUpdate = true;
  camera.lookAt( scene.position );
  renderer.render( scene, camera );

}

//Se manda a llamar main y la animacion
main();
animate();
