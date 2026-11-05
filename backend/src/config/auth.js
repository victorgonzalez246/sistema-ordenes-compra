require('dotenv').config({ quiet: true });

// Configuración del token. La clave secreta solo vive en el .env, nunca en el código.
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error(
    'Falta JWT_SECRET en backend/.env (mínimo 32 caracteres). ' +
      'Genera una con: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"'
  );
}

module.exports = {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  // Un solo algoritmo permitido al verificar: evita aceptar tokens con "alg: none" u otro algoritmo
  JWT_ALGORITMO: 'HS256',
  BCRYPT_RONDAS: 10,
};
