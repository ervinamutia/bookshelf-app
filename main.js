const books = [];
const storageKey = 'STORAGE-KEY';
const RENDER_EVENT = 'render-book';
const SAVED_EVENT = 'save-book';

function checkForStorage() {
    return typeof (Storage) !== 'undefined';
}

// Submit Data Buku Baru
document.addEventListener('DOMContentLoaded', function () {
    if (checkForStorage ()) {
        if (localStorage.getItem(storageKey) !== null) {
            getDataFromStorage();
            document.dispatchEvent(new Event(RENDER_EVENT));
        }
    } else {
        alert('Browser anda tidak mendukung web storage!');
    }

    const submitForm = document.getElementById('bookForm');
    submitForm.addEventListener('submit', function(event) {
        event.preventDefault();
        addNewBook();
        submitForm.reset();
    });

    const searchForm = document.getElementById('searchBooks');
    searchForm.addEventListener('submit', function (event) {
        event.preventDefault();
        document.dispatchEvent(new Event(RENDER_EVENT));
    })
});

function addNewBook() {
    const title = document.getElementById('bookFormTitle').value;
    const author = document.getElementById('bookFormAuthor').value;
    const publicationYear = parseInt(document.getElementById('bookFormYear').value);
    const isComplete = document.getElementById('bookFormIsComplete').checked;

    const generatedId = generateId();
    const bookObject = generateBookObject(generatedId, title, author, publicationYear, isComplete);
    books.push(bookObject);

    document.dispatchEvent(new Event(RENDER_EVENT));
    saveBookToStorage();
}

function generateId(){
    return +new Date();
}

function generateBookObject(id, title, author, year, isComplete) {
    return {
        id,
        title,
        author,
        year,
        isComplete
    }
}

function saveBookToStorage() {
    if (checkForStorage ()) {
        const parsed = JSON.stringify(books);
        localStorage.setItem(storageKey, parsed);
        document.dispatchEvent(new Event(SAVED_EVENT));
    }
}

function getDataFromStorage() {
    const data = JSON.parse(localStorage.getItem(storageKey));
    if (data !== null) {
        for (const buku of data) {
            books.push(buku);
        }
    }
}

// Untuk Tampilan UI Rak Buku
function placeBookShelf(bookObject) {
    const bookTitle = document.createElement('h3');
    bookTitle.setAttribute('data-testid', 'bookItemTitle');
    bookTitle.innerText = bookObject.title;
    const bookAuthor = document.createElement('p');
    bookAuthor.setAttribute('data-testid', 'bookItemAuthor');
    bookAuthor.innerText = bookObject.author;
    const bookYear = document.createElement('p');
    bookYear.setAttribute('data-testid', 'bookItemYear');
    bookYear.innerText = bookObject.year;

    const textContainer = document.createElement('div');
    textContainer.append(bookTitle, bookAuthor, bookYear);

    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('button-container');

    if (!bookObject.isComplete) {
        const buttonRead = document.createElement('button');
        buttonRead.innerText = 'Selesai dibaca';
        buttonRead.setAttribute('data-testid', 'bookItemIsCompleteButton');
        buttonRead.classList.add('readedButton');
        buttonRead.addEventListener('click', function() {
            // baiknya kau kirim saja id-nya. Jangan keseluruhan object yang kau kirim (ditulis 'bookObject' saja) karena nanti malah jadi objek by reference, dan bukannya memodifikasi data asli dalam books=[]. Awas jadi bug yang susah ditemuin
            addBookToReaded(bookObject.id);
        })
        buttonContainer.append(buttonRead);
    } else {
        const buttonUnread = document.createElement('button');
        buttonUnread.innerHTML = 'Belom selesai dibaca';
        buttonUnread.setAttribute('data-testid', 'bookItemIsCompleteButton');
        buttonUnread.classList.add('unreadButton');
        buttonUnread.addEventListener('click', function () {
            addBookToUnRead(bookObject.id);
        })
        buttonContainer.append(buttonUnread);
    }

    const buttonRemove = document.createElement('button');
    buttonRemove.setAttribute('data-testid', 'bookItemDeleteButton');
    buttonRemove.classList.add('removeButton');
    buttonRemove.innerText = 'Hapus';
    buttonRemove.addEventListener('click', function() {
        removeBook(bookObject.id);
    })
    const buttonEdit = document.createElement('button');
    buttonEdit.setAttribute('data-testid', 'bookItemEditButton');
    buttonEdit.classList.add('editButton');
    buttonEdit.innerText = 'Edit';
    buttonEdit.addEventListener('click', function() {
        editBook(bookObject.id);
    })

    buttonContainer.append(buttonRemove, buttonEdit);

    const bookCard = document.createElement('div');
    bookCard.classList.add('bookCard');
    bookCard.setAttribute('data-bookid', bookObject.id);
    bookCard.setAttribute('data-testid', 'bookItem');

    bookCard.append(textContainer, buttonContainer);

    return bookCard;
}

document.addEventListener(RENDER_EVENT, function () {
    const unReadBook =  document.getElementById('incompleteBookList');
    unReadBook.innerHTML = '';

    const readedBook = document.getElementById('completeBookList');
    readedBook.innerHTML = '';

    // Utuk fitur Search
    const foundBookField = document.getElementById('hasil-temuan-container');
    const keyword = document.getElementById('searchInput').value.toLowerCase();
    const garisLurus = document.getElementById('garis');
    // .value dari input tidak pernah return null, selalu return string. Kalau input kosong, dia return string kosong ''. Jadi kondisi (keyword === null) tidak akan pernah terpenuhi, dan foundBookField tidak akan pernah tersembunyi saat keyword dikosongkan. Maka harus (keyword === '')
    if (keyword === '') {
        foundBookField.setAttribute('hidden', '');
        garisLurus.setAttribute('hidden', '');
    } else {
        const filteredBooks = books.filter((book) => {
            return book.title.toLowerCase().includes(keyword);
        })

        foundBookField.innerHTML = '';
        foundBookField.removeAttribute('hidden');
        garisLurus.removeAttribute('hidden');
        
        if (filteredBooks.length === 0) {
            const notFound = document.createElement('p');
            notFound.innerText = 'Buku yang anda cari tidak tersedia.';
            foundBookField.append(notFound);
        } else {
            const message = document.createElement('p');
            message.innerText = `Pencarian untuk "${keyword}"`;
            foundBookField.append(message);
            for (const book of filteredBooks) {
                const filteredBookCard = placeBookShelf(book);
                foundBookField.append(filteredBookCard);
            }
        }
    }

    for (const bookItem of books) {
        const bookCard = placeBookShelf(bookItem);
        if (!bookItem.isComplete) {
            unReadBook.append(bookCard);
        } else {
            readedBook.append(bookCard);
        }
    }
});

document.addEventListener(SAVED_EVENT, function () {
    console.log(localStorage.getItem(storageKey));
});

function findBook(bookId) {
    for (const item of books) {
        if (item.id === bookId) {
            return item;
        }
    }
    return null;
}

function addBookToReaded (bookId) {
    const bookTarget = findBook(bookId);

    if (bookTarget == null) return;

    bookTarget.isComplete = true;
    document.dispatchEvent(new Event(RENDER_EVENT));
    saveBookToStorage();
}

function addBookToUnRead (bookId) {
    const bookTarget = findBook(bookId);

    if (bookTarget == null) return;

    bookTarget.isComplete = false;
    document.dispatchEvent(new Event(RENDER_EVENT));
    saveBookToStorage();
}

function findBookIndex (bookItem) {
    // findIndex otomatis return -1 kalo data tidak ketemu
    return books.findIndex((item) => item.id === bookItem);
}

function removeBook (bookId) {
    const bookTarget = findBookIndex(bookId);

    if (bookTarget === -1) return;

    books.splice(bookTarget, 1);
    document.dispatchEvent(new Event(RENDER_EVENT));
    saveBookToStorage();
}

// var global untuk edit buku
let currentBookId = null;
const modal = document.getElementById('bookEditModal');

function editBook (bookId) {
    const bookTarget = findBook(bookId);
    if (bookTarget == null) return;
    
    document.getElementById('bookEditTitle').value = bookTarget.title;
    document.getElementById('bookEditAuthor').value = bookTarget.author;
    document.getElementById('bookEditYear').value = bookTarget.year;
    
    // untuk dipakai listener submit
    currentBookId = bookId;

    modal.showModal();
}

const formEditedBook = document.getElementById('editedBookForm');
formEditedBook.addEventListener('submit', function(event) {
    event.preventDefault();
    
    const bookTarget = findBook(currentBookId);

    if (bookTarget == null) return;

    const editedTitle = document.getElementById('bookEditTitle').value;
    const editedAuthor = document.getElementById('bookEditAuthor').value;
    const editedYear = document.getElementById('bookEditYear').value;
    bookTarget.title = editedTitle;
    bookTarget.author = editedAuthor;
    bookTarget.year = editedYear;
    
    document.dispatchEvent(new Event(RENDER_EVENT));
    saveBookToStorage();
    
    modal.close();
});

const cancelButton = document.getElementById('editCancel');
cancelButton.addEventListener('click', function() {
    modal.close();
});
