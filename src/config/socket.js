const { Server } = require('socket.io');
const { registerSocketHandlers } = require('../socket/socketHandlers');

let _io = null;

const initSocket = (server) => {
    _io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });

    registerSocketHandlers(_io);

    return _io;
};

const getIo = () => _io;

module.exports = { initSocket, getIo };
