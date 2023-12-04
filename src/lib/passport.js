const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const pool = require('../database');
const helpers = require('./helpers');

passport.use('local.signin', new LocalStrategy({
  usernameField: 'Usuario',
  passwordField: 'Contrasena',
  passReqToCallback: true
}, async (req, Usuario, Contrasena, done) => {
  const rows = await pool.query('SELECT * FROM usuarios WHERE Usuario = ?', [Usuario]);
  if (rows.length > 0) {
    const user = rows[0];
    const validPassword = await helpers.matchPassword(Contrasena, user.Contrasena)
    if (validPassword) {
      done(null, user, req.flash('success', 'Bienvenido ' + user.Usuario));
    } else {
      done(null, false, req.flash('message', 'Contraseña incorrecta'));
    }
  } else {
    return done(null, false, req.flash('message', 'El usuario no existe.'));
  }
}));

// Registro
passport.use('local.signup', new LocalStrategy({
  usernameField: 'Usuario',
  passwordField: 'Contrasena',
  passReqToCallback: true
}, async (req, Usuario, Contrasena, done) => {

  const {DNI, Nombres, Apellidos, FechaNacimiento, LugarNacimiento, DirCorrespondencia, Genero, CorreoElectronico, TemasPreferencia } = req.body;

  let newUser = {
    TipoUsuario: 'Cliente',
    DNI,// Asegúrate de que el campo DNI esté en el formulario
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
  newUser.Contrasena = await helpers.encryptPassword(Contrasena);
  // Saving in the Database
  const result = await pool.query('INSERT INTO usuarios SET ?', newUser);
  newUser.UsuarioID = result.insertId;
  return done(null, newUser);
}));

passport.serializeUser((user, done) => {
  done(null, user.UsuarioID);
});

passport.deserializeUser(async (id, done) => {
  const rows = await pool.query('SELECT * FROM usuarios WHERE UsuarioID = ?', [id]);
  done(null, rows[0]);
});