class FetchRequest {
    /**
     * url для отправки запроса
     * @type {string}
     */
    #url = '';

    /**
     * дополнительные опции запроса
     * @type {{}}
     */
    #options = {};

    /**
     * @param url
     * @param options
     */
    constructor(url, options) {
        this.#url = url;
        this.#options = options;
    }

    /**
     * получает ответ
     * проверка HTTP-кода ответа (status)
     *
     * @param response
     * @return {Promise<never>|Promise<unknown>}
     */
    static status(response) {
        if (response.status >= 200 && response.status < 300) {
            return Promise.resolve(response)
        } else {
            return Promise.reject(new Error(response.statusText))
        }
    }

    /**
     * декодирует ответ в формате JSON
     *
     * @param response
     * @return {any | Promise<any>}
     */
    static json(response) {
        return response.json()
    }

    /**
     * асихнхронный запрос
     * @return {Promise<Response|*[]>}
     */
    async get() {
        return await fetch(this.#url, this.#options)
            .then(FetchRequest.status)
            .then(FetchRequest.json)
            .then(function (data) {
                // console.log('Request succeeded with JSON response', data);

                return data;

            }).catch(function (error) {
                // console.log('Request failed', error);
                return [];
            });
    }
}

export {FetchRequest}