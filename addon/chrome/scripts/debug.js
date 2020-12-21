const debug = {

    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),

    CONFIG: true,
    CONNECTOR_SEND: true,
    CONNECTOR_RECEIVE: true,

    logging: false,
    log: (type, message) => {
        if (!debug.logging || !type) return;
        console.log("[Log]: " + message());
    }

};