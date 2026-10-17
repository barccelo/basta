'use strict';
const categoryGroups = [
 {name:'Naturaleza',items:['Animales','Aves','Animales marinos','Insectos','Mamíferos','Reptiles','Plantas y flores','Árboles','Cosas del bosque','Fenómenos naturales']},
 {name:'Comida y bebida',items:['Frutas','Vegetales','Comidas','Postres','Bebidas','Ingredientes','Especias y condimentos','Comida rápida','Cosas del desayuno','Dulces y golosinas']},
 {name:'Personas',items:['Nombres de mujer','Nombres de hombre','Apellidos','Profesiones','Personajes históricos','Cualidades de una persona','Emociones','Partes del cuerpo','Cosas que hace un bebé','Apodos']},
 {name:'Lugares y viajes',items:['Países','Ciudades','Lugares para viajar','Lugares de una ciudad','Medios de transporte','Cosas que llevas de viaje','Cosas de la playa','Cosas de un aeropuerto','Lugares donde hace frío','Lugares para una cita']},
 {name:'Casa y vida diaria',items:['Cosas de la cocina','Electrodomésticos','Muebles','Cosas del baño','Objetos del dormitorio','Productos de limpieza','Cosas del jardín','Cosas del supermercado','Objetos que caben en un bolsillo','Cosas que pierdes fácilmente']},
 {name:'Cine, música y cultura',items:['Películas','Series','Actores y actrices','Cantantes y bandas','Canciones','Instrumentos musicales','Personajes de ficción','Libros','Dibujos animados','Cuentos y leyendas']},
 {name:'Juegos y deportes',items:['Deportes','Equipos deportivos','Deportistas','Objetos para hacer deporte','Juegos de mesa','Videojuegos','Juguetes','Juegos de la infancia','Actividades al aire libre','Cosas de un parque de diversiones']},
 {name:'Escuela y tecnología',items:['Cosas del colegio','Asignaturas','Útiles escolares','Cosas de una oficina','Marcas','Aplicaciones','Dispositivos electrónicos','Cosas de internet','Inventos','Palabras de ciencia']},
 {name:'Estilo y celebraciones',items:['Prendas de vestir','Calzado','Accesorios','Colores','Disfraces','Cosas de una fiesta','Regalos','Cosas de una boda','Cosas de Navidad','Productos de belleza']},
 {name:'Algo que…',items:['Algo que vuele','Algo que flote','Algo que haga ruido','Algo que dé miedo','Algo que huela bien','Algo que sea redondo','Algo que sea pequeño','Algo que sea muy grande','Algo que puedas romper','Algo que te haga reír']}
];
const customCategories=[];
try{const saved=JSON.parse(localStorage.getItem('basta-custom-categories')||'[]');if(Array.isArray(saved))customCategories.push(...saved.filter(x=>typeof x==='string'&&x.trim()).map(x=>x.slice(0,60)))}catch{}
