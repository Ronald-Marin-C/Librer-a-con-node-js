const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const express = require('express');
const router = express.Router();

const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');
const helpers = require('../lib/helpers');
const nodemailer = require('nodemailer');

router.get('/add', (req, res) => {
    res.render('/');
});

router.get('/Usuarios', async (req, res) => {
    const rol = await pool.query('SELECT * FROM usuarios WHERE UsuarioID = ?', [req.user.UsuarioID]);
    console.log(rol[0].TipoUsuario);
    if(rol[0].TipoUsuario == 'Cliente'){
        res.redirect('/links/books');
    }
    else if(rol[0].TipoUsuario == 'Root'){
        res.redirect('/links/TableAdmin');
    }
    else if(rol[0].TipoUsuario == 'Administrador'){
        res.redirect('/links/TableLibros');
    }
    
});

router.post('/add', async (req, res) => {
    const { TipoUsuario,  DNI, Nombres, Apellidos, FechaNacimiento,
            LugarNacimiento, DirCorrespondencia, Genero, CorreoElectronico,
            TemasPreferencia, Usuario, Contrasena} = req.body;
    const newLink = {
        TipoUsuario,
        DNI,
        Nombres,
        Apellidos,
        FechaNacimiento,
        LugarNacimiento,
        DirCorrespondencia,
        Genero,
        CorreoElectronico,
        TemasPreferencia,
        Usuario,
        Contrasena
    };
    await pool.query('INSERT INTO usuarios set ?', [newLink]);
    req.flash('success', 'Cambios realizados');
    res.redirect('/links');
});

router.get('/', isLoggedIn, async (req, res) => {
    const links = await pool.query('SELECT * FROM usuarios WHERE UsuarioID = ?', [req.user.UsuarioID]);
    res.render('links/list', { links });
});





router.get('/delete/:UsuarioID', async (req, res) => {
    const { UsuarioID } = req.params;
    await pool.query('DELETE FROM usuarios WHERE UsuarioID = ?', [UsuarioID]);
    req.flash('success', 'Usuario eliminado');
    res.redirect('/links/TableAdmin');
});

router.get('/edit/:UsuarioID', async (req, res) => {
    const { UsuarioID } = req.params;
    const links = await pool.query('SELECT * FROM usuarios WHERE UsuarioID = ?', [UsuarioID]);
    console.log(links);
    res.render('links/edit', {usuarios: links[0]});
});

router.post('/edit/:UsuarioID', async (req, res) => {
    const { UsuarioID } = req.params;
    const links = await pool.query('SELECT * FROM usuarios WHERE UsuarioID = ?', [UsuarioID]);

    const { TipoUsuario,  DNI, Nombres, Apellidos, FechaNacimiento,
        LugarNacimiento, DirCorrespondencia, Genero, CorreoElectronico,
        TemasPreferencia, Usuario, Contrasena} = req.body;
        const newLink = {
            TipoUsuario: links[0].TipoUsuario,
            DNI,
            Nombres,
            Apellidos,
            FechaNacimiento,
            LugarNacimiento,
            DirCorrespondencia,
            Genero,
            CorreoElectronico,
            TemasPreferencia,
            Usuario,
            Contrasena
        };
        
    newLink.Contrasena = await helpers.encryptPassword(Contrasena);
    await pool.query('UPDATE usuarios set ? WHERE UsuarioID = ?', [newLink, UsuarioID]);
    req.flash('success', 'Usuario actualizado');
    res.redirect('/profile');
});

// Tabla de administradores
router.get('/TableAdmin', async (req, res) => {
    const admins = await pool.query('SELECT * FROM usuarios');
    console.log(admins[0]);
    res.render('links/TableAdmin', {admins});
});

//Editar admin
router.get('/editAdmin/:UsuarioID', async (req, res) => {
    const { UsuarioID } = req.params;
    const links = await pool.query('SELECT * FROM usuarios WHERE UsuarioID = ?', [UsuarioID]);
    console.log(links);
    res.render('links/editAdmin', {usuarios: links[0]});
});

router.post('/editAdmin/:UsuarioID', async (req, res) => {
    const { UsuarioID } = req.params;
    const links = await pool.query('SELECT * FROM usuarios WHERE UsuarioID = ?', [UsuarioID]);

    const { TipoUsuario,  DNI, Nombres, Apellidos, FechaNacimiento,
        LugarNacimiento, DirCorrespondencia, Genero, CorreoElectronico,
        TemasPreferencia, Usuario, Contrasena, ConfirmarContrasena} = req.body;
        const newLink = {
            TipoUsuario: links[0].TipoUsuario,
            DNI,
            Nombres,
            Apellidos,
            FechaNacimiento,
            LugarNacimiento,
            DirCorrespondencia,
            Genero,
            CorreoElectronico,
            TemasPreferencia,
            Usuario,
            Contrasena
        };
    newLink.Contrasena = await helpers.encryptPassword(Contrasena);
    await pool.query('UPDATE usuarios set ? WHERE UsuarioID = ?', [newLink, UsuarioID]);
    req.flash('success', 'Usuario actualizado');
    res.redirect('/profile');
});

//Add Admin 
router.get('/newAdmin', (req, res) => {
    res.render('links/newAdmin');
});

router.post('/newAdmin', async (req, res) => {
    const { TipoUsuario,  DNI, Nombres, Apellidos, FechaNacimiento,
            LugarNacimiento, DirCorrespondencia, Genero, CorreoElectronico,
            TemasPreferencia, Usuario, Contrasena} = req.body;
    const newLink = {
        TipoUsuario: 'Administrador',
        DNI,
        Nombres,
        Apellidos,
        FechaNacimiento,
        LugarNacimiento,
        DirCorrespondencia,
        Genero,
        CorreoElectronico,
        TemasPreferencia,
        Usuario,
        Contrasena
    };
    newLink.Contrasena = await helpers.encryptPassword(Contrasena);
    // Saving in the Database
    const result = await pool.query('INSERT INTO usuarios SET ?', newLink);
    newLink.UsuarioID = result.insertId;
    req.flash('success', 'Usuario creado');
    res.redirect('/links/TableAdmin');

    //   await pool.query('INSERT INTO usuarios set ?', [newLink]);
    //req.flash('success', 'Cambios realizados');
    //
});

passport.serializeUser((user, done) => {
    done(null, user.UsuarioID);
  });
  
passport.deserializeUser(async (id, done) => {
    const rows = await pool.query('SELECT * FROM usuarios WHERE UsuarioID = ?', [id]);
    done(null, rows[0]);
});

//Filtrar usuario: 
router.get('/filtrar', async (req, res) => {
    const codigo = req.query.codigo;
    // Lógica para buscar usuarios por el código en la base de datos
    const usuariosFiltrados = await buscarUsuariosPorCodigo(codigo);
    res.render('vista-de-resultados', { usuarios: usuariosFiltrados });
});

//Norticias
router.get('/news', (req, res) => {
    res.render('links/news');
});

router.post('/news', (req, res) => {
    // Obtener los datos del formulario de la solicitud POST
    const { nombre, correo } = req.body;
  
    // Validar que se proporcionó un correo electrónico
    if (!correo) {
      return res.status(400).send('El correo electrónico es obligatorio.');
    }
  
    // Configuración del transporte para Nodemailer (configúralo con tus propias credenciales)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'tu_correo@gmail.com',
        pass: 'tu_contraseña'
      }
    });
  
    // Configuración del correo electrónico
    const mailOptions = {
      from: 'tu_correo@gmail.com',
      to: correo,
      subject: 'Registro Exitoso',
      text: `¡Hola ${nombre}!\n\nGracias por registrarte en nuestro sistema de noticias. Estamos emocionados de tenerte a bordo.\n\nAtentamente,\nTu Equipo de Noticias`
    };
  
    // Envío del correo electrónico
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
        res.status(500).send('Error al enviar el correo electrónico de confirmación.');
      } else {
        console.log('Correo electrónico de confirmación enviado: ' + info.response);
        res.status(200).send('Registro exitoso. Se ha enviado un correo electrónico de confirmación.');
      }
    });
  });

//Foro
router.get('/foro', (req, res) => {
    res.render('links/foro');
});

//Libros:
router.get('/books', async (req, res) => {
    const lista = await pool.query('SELECT * FROM libros');
    res.render('links/books', {links: lista});
})

//Tabla administración de libros. 
router.get('/TableBooks', async (req, res) => {
    const books = await pool.query('SELECT * FROM libros');
    res.render('links/TableBooks', {books});
});

//Nuevo libro: 
router.get('/newbook', (req, res) => {
    res.render('links/newbook');
});

router.post('/newbook', async (req, res) => {
    const { titulo,  autor, aniopublicacion, genero, 
        numpaginas, editorial, ISSN, idioma,
        fechapublicacion, estado, precio} = req.body;
    const newBook = {
        titulo,  
        autor, 
        aniopublicacion, 
        genero, 
        numpaginas, 
        editorial, 
        ISSN, 
        idioma,
        fechapublicacion, 
        estado, 
        precio
    }
    await pool.query('INSERT INTO libros set ?', [newBook]);
    req.flash('success', 'Libro añadido');

    res.redirect('/links/TableBooks');
});


// Ruta para editar un libro
router.get('/editBook/:LibroID', async (req, res) =>{
    const {LibroID} = req.params;
    const edit = await pool.query('SELECT * FROM libros WHERE LibroID = ?', [LibroID])
    res.render('links/editBook', {links: edit[0]});
})

router.post('/editBook/:LibroID', async (req, res) =>{
    const {LibroID} = req.params;
    const { titulo,  autor, aniopublicacion, genero, 
        numpaginas, editorial, ISSN, idioma,
        fechapublicacion, estado, precio} = req.body;
        const newBook = {
            titulo,  
            autor, 
            aniopublicacion, 
            genero, 
            numpaginas, 
            editorial, 
            ISSN, 
            idioma,
            fechapublicacion, 
            estado, 
            precio
        };
        await pool.query('UPDATE libros set ? WHERE LibroID = ?', [newBook, LibroID]);
    req.flash('success', 'Libro editado');
        res.redirect('/links/TableBooks');
});

//eliminar libro
router.get('/deletelibro/:LibroID', async (req, res) =>{
    const {LibroID} = req.params;
    await pool.query('DELETE FROM libros WHERE LibroID = ?', [LibroID]);
    req.flash('success', 'Libro eliminado');
    res.redirect('/links/TableBooks');

})


module.exports = router;