const db = require('../../config/db');
const passwords = require('../models/passwords.model');
const cryptoRandomString = require('crypto-random-string');

exports.register = async function (firstName, lastName, email, password) {
    const conn = await db.getPool().getConnection();
    const query = 'insert into user (email, first_name, last_name, password) values (?, ?, ?, ?)';
    const passwordHash = await passwords.hash(password);
    const [ result ] = await conn.query(query, [email, firstName, lastName, passwordHash]);
    conn.release();
    return result;
};

exports.getUserFromEmail = async function(email) {
    const conn = await db.getPool().getConnection();
    const query = 'select * from user where email = ?';
    const [ rows ] = await conn.query( query, [email] );
    conn.release();
    return rows;
};

exports.getUserFromEmailPassword = async function(email, password) {
    const conn = await db.getPool().getConnection();
    const query = 'select * from user where email = ? AND password = ?';
    const passwordHash = await passwords.hash(password);
    const [ rows ] = await conn.query( query, [email, passwordHash] );
    conn.release();
    return rows;
};

exports.login = async function (id) {
    const conn = await db.getPool().getConnection();
    const query = 'update user set auth_token = ? where id = ?';
    const userToken = cryptoRandomString({length: 32});
    await conn.query(query, [userToken, id])
    conn.release();
    return [id, userToken];
};

exports.getUserFromToken = async function (userToken) {
    const conn = await db.getPool().getConnection();
    const query = 'select * from user where auth_token = ?';
    const [ rows ] = await conn.query(query, [userToken])
    conn.release();
    return rows;
};

exports.logout = async function (id) {
    const conn = await db.getPool().getConnection();
    const query = 'update user set auth_token = null where id = ?';
    await conn.query(query, [id])
    conn.release();
};

exports.getUserFromId = async function(id) {
    const conn = await db.getPool().getConnection();
    const query = 'select * from user where id = ?';
    const [ rows ] = await conn.query( query, [id] );
    conn.release();
    return rows;
};

exports.updateFirstFromId = async function (firstName, id) {
    const conn = await db.getPool().getConnection();
    const query = 'update user set first_name = ? where id = ?';
    await conn.query(query, [firstName, id])
    conn.release();
};

exports.updateLastFromId = async function (lastName, id) {
    const conn = await db.getPool().getConnection();
    const query = 'update user set last_name = ? where id = ?';
    await conn.query(query, [lastName, id])
    conn.release();
};

exports.updateEmailFromId = async function (email, id) {
    const conn = await db.getPool().getConnection();
    const query = 'update user set email = ? where id = ?';
    await conn.query(query, [email, id])
    conn.release();
};

exports.updatePasswordFromId = async function (password, id) {
    const conn = await db.getPool().getConnection();
    const query = 'update user set password = ? where id = ?';
    const passwordHash = await passwords.hash(password);
    await conn.query(query, [passwordHash, id])
    conn.release();
};

exports.hashPassword = async function (password) {
    return passwords.hash(password);
}
