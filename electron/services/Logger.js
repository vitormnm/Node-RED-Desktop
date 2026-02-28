class Logger {
    constructor() {}

   
    #getTimestamp() {
        const now = new Date();
        const pad = (n) => n.toString().padStart(2, '0');

        const day = pad(now.getDate());
        const month = pad(now.getMonth() + 1);
        const year = now.getFullYear();

        const hours = pad(now.getHours());
        const minutes = pad(now.getMinutes());
        const seconds = pad(now.getSeconds());

        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    }


    info(message) {
        console.log(`${this.#getTimestamp()} - [info] ${message}`);
    }


    error(message) {
        console.error(`${this.#getTimestamp()} - [error] ${message}`);
    }
}

export default new Logger();



