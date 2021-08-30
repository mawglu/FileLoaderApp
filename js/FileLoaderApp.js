import {FetchRequest} from "./FetchRequest.js";

class FileLoaderApp {

    /**
     * @type Element
     */
    #element = null;

    /**
     * @type []
     */
    #response = null;

    /**
     * @type Element
     */
    #select = null;

    /**
     * @type Element
     */
    #selectPlace = null;

    /**
     * @type {Element[]}
     */
    #inputArr = [];

    /**
     * @type {*[]}
     */
    #fileTypes = [
        'image/png',
        'image/jpeg',
        'image/gif',
        'image/bmp',
        'application/pdf'
    ];

    /**
     * @type {number}
     */
    #numOfActiveInput = 0;

    /**
     * @param element
     */
    constructor(element) {
        this.#element = element;
    }

    /**
     * Инициализация метовод после отклика
     * @return {Promise<void>}
     */
    async init() {
        this.#response = await this.getFileCategories();
        this.initSelect();
        this.initInputs();
        this.showOneFileInput(0);
        this.setupEventListeners();
        this.initFileListContainer();
    }

    /**
     * Запрос данных
     * @return {Promise<Response|*[]>}
     */
    async getFileCategories() {
        const url = 'data/fileListCategories.json';
        const options = {method: 'GET'};
        const fileCategories = new FetchRequest(url, options);

        return await fileCategories.get();
    }

    /**
     * Инициализация выбора категории
     */
    initSelect() {
        const self = this;

        self.#select = document.createElement('select');
        self.#selectPlace = document.querySelector('.file-loader-modal');

        let option = document.createElement('option');

        option.setAttribute('value', '');
        option.setAttribute('data-cnt', '0');
        option.setAttribute('disabled', 'true');
        option.innerHTML += 'Пожалуйста, сделайте выбор';

        self.#select.append(option);

        self.#response.map(function (item) {
            let option = document.createElement('option');

            option.setAttribute('value', `${item.name}`);
            option.setAttribute('data-cnt', `${item.cnt}`);
            option.setAttribute('data-accept', `${item.accept}`);
            option.innerHTML += item.name;

            self.#select.append(option);
        });

        self.#select.selectedIndex = 0;
        self.#selectPlace.append(self.#select);
    }

    /**
     * Инициализация всех полей ввода
     */
    initInputs() {
        const self = this;

        self.#response.map(function (item) {
            for (let i = 0; i < item.cnt; i++) {
                const label = FileLoaderApp.createInput();

                self.#inputArr.push(label);
                self.#element.append(label);
            }
        });
    }

    /**
     * Создание поля ввода
     * @return {HTMLElement}
     */
    static createInput() {
        let label = document.createElement('label');
        let input = document.createElement('input');

        label.innerHTML += '<span>Перетащите сюда файл или кликните, чтобы выбрать из папки (только .png, .jpg, .gif, .bmp, .pdf)</span>';
        input.setAttribute('type', 'file');
        input.setAttribute('data-category', '');
        label.append(input);

        return label;
    }

    /**
     * Отображает только одно поле ввода в зависимости от его index
     * @param number
     */
    showOneFileInput(number) {
        let changed = false;

        this.#inputArr.map(function (item, index) {
            item.classList.remove('d-flex');
            item.classList.add('d-none');
            if (number === index) {
                item.classList.add('d-flex');
                item.classList.remove('d-none');
                changed = true;
            }
        });

        if (changed) this.#numOfActiveInput = number;
    }

    /**
     * Установка слушателя для разных node-элементов
     */
    setupEventListeners() {
        const self = this;

        // слушает изменения у select и input внутри контейнера
        this.#element.addEventListener('change', function (event) {
            switch (event.target.nodeName) {
                case 'SELECT':
                    self.selectChanged(event);
                    self.showSelectFileCategory('none');
                    break;
                case 'INPUT':
                    for (let i = 0; i < event.target.files.length; i++) {
                        if (self.validFileType(event.target.files[i]) && self.validFileSize(event.target.files[i])) {
                            self.showSelectFileCategory();
                        } else {
                            const dt = new DataTransfer();
                            event.target.files = dt.files;
                        }
                    }
                    break;
            }
        });

        // слушает изменения у button внутри контейнера
        this.#element.addEventListener('click', function (event) {
            switch (event.target.nodeName) {
                case 'BUTTON':
                    switch (event.target.dataset.action) {
                        case 'clearInput':
                            self.actionClearInput(event);
                            break;
                        default:
                            break;
                    }
                    break;
            }
        });
    }

    /**
     * Инициализация контейнера для просмотра загруженных документов
     */
    initFileListContainer() {
        const viewContainer = document.createElement('div');
        viewContainer.className = 'file-loader-view';
        this.#element.after(viewContainer);
    }

    /**
     * Обработка выбора категории
     * @param event
     */
    selectChanged(event) {
        const target = event.target;
        const oldCnt = parseInt(target.options[target.selectedIndex].dataset.cnt);

        this.#fileTypes = target.options[target.selectedIndex].getAttribute('data-accept').split(',');

        if (oldCnt > 0) {
            const label = this.#inputArr[this.#numOfActiveInput];
            const input = label.getElementsByTagName('input')[0];

            input.setAttribute('data-category', target.value);
            input.setAttribute('name', `file${this.#numOfActiveInput}`);

            this.showOnlyFirstEmptyInput();

            target.options[target.selectedIndex].dataset.cnt = oldCnt - 1 + '';

            if ((oldCnt - 1) === 0) {
                target.options[target.selectedIndex].setAttribute('disabled', true);
                console.warn('Выбран тип документа, для которого уже загружено максимальное количество файлов.');
            }
        }

        this.renderFileListView();

        event.target.value = '';
    }

    /**
     * Отображение/скрытие выпадающего списка с категориями
     * @param display
     */
    showSelectFileCategory(display = 'flex') {
        this.#selectPlace.style.display = display;
    }

    /**
     * Инициализация очищения поля ввода и его аттрибутов
     * @param event
     */
    actionClearInput(event) {
        const buttonRemove = event.target;
        const inputNumber = parseInt(buttonRemove.getAttribute('data-input-number'));

        this.deleteFile(inputNumber);
        this.showOnlyFirstEmptyInput();
        this.renderFileListView();
    }

    /**
     * Очищение files (FileList) у выбранного поля ввода
     * Очищение аттриабутов выбранного поля ввода
     * @param inputNumber
     */
    deleteFile(inputNumber) {
        const label = this.#inputArr[inputNumber];
        const input = label.getElementsByTagName('input')[0];
        const oldCategory = input.getAttribute('data-category');

        input.files = (new DataTransfer()).files;

        [...this.#select.options].map((option) => {
            if (option.value === oldCategory) {
                option.dataset.cnt = (parseInt(option.dataset.cnt) + 1) + '';
                option.removeAttribute('disabled');
            }
        });

        input.setAttribute('data-category', '');
        input.setAttribute('name', '');
    }

    /**
     * Переключение отображаемого поля ввода
     */
    showOnlyFirstEmptyInput() {
        // скрываем все
        this.#inputArr.map((label) => {
            label.classList.add('d-none');
            label.classList.remove('d-flex');
        });

        // показываем первый с пустой категорией
        for (let index = 0; index < this.#inputArr.length; index++) {
            const label = this.#inputArr[index];
            const input = label.getElementsByTagName('input')[0];

            if (input.getAttribute('data-category').length === 0) {
                label.classList.remove('d-none');
                label.classList.add('d-flex');
                this.#numOfActiveInput = index;

                break;
            }
        }
    }

    /**
     * Рендер контейнера просмотра загружаемых файлов
     */
    renderFileListView() {
        const self = this;
        const fileViewPlace = document.querySelector('.file-loader-view');
        fileViewPlace.innerHTML = '';

        self.#inputArr.map((label, inputNumber) => {
            const inpElem = label.getElementsByTagName('input')[0];
            const inpFiles = inpElem.files;
            const CurFileCategory = inpElem.getAttribute('data-category');

            for (let i = 0; i < inpFiles.length; i++) {
                const row = document.createElement('div');
                const buttonRemove = document.createElement('button');
                const size = self.returnFileSize(inpFiles[i].size);

                row.className = 'item';
                row.setAttribute('data-input-file', inputNumber + '-' + i);

                buttonRemove.className = 'remove';
                buttonRemove.innerHTML = 'remove';
                buttonRemove.setAttribute('data-action', 'clearInput');
                buttonRemove.setAttribute('data-input-number', inputNumber + '');
                buttonRemove.setAttribute('type', 'button');

                let inner = `<b>${inpFiles[i].name}</b> ${CurFileCategory} ${size}`;

                row.innerHTML += inner;
                row.append(buttonRemove);
                fileViewPlace.append(row);
            }
        });
    }

    /**
     * Валидация загружаемого типа файла
     * @param file
     * @return {boolean}
     */
    validFileType(file) {
        for (let i = 0; i < this.#fileTypes.length; i++) {
            if (file.type === this.#fileTypes[i]) {
                return true;
            }
        }
        return false;
    }

    validFileSize(file) {
        return (file.size / 1048576).toFixed(1) <= 25;
    }

    /**
     * Принимает число и превращает его в отформатированный размер в байтах/KB/MB.
     * @param number
     * @return {string}
     */
    returnFileSize(number) {
        if (number < 1024) {
            return number + 'bytes';
        } else if (number > 1024 && number < 1048576) {
            return (number / 1024).toFixed(1) + 'KB';
        } else if (number > 1048576) {
            return (number / 1048576).toFixed(1) + 'MB';
        }
    }
}

const fileLoader = new FileLoaderApp(document.querySelector('.file-loader-container'));
fileLoader.init();
