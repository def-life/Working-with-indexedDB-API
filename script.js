const APP = {
  db: null,
  dbName: "whishkeyDB",
  version: 1,
  init: function () {
    APP.openDatabase(); // the function open connection, create store and indexes;
    APP.addEvents();
    
  },

  openDatabase: function () {
    let request = indexedDB.open(APP.dbName, APP.version);
    request.onsuccess = (ev) => {
      APP.db = ev.target.result;

      // adding a common handler for all errors related to db operations
      APP.db.onerror = APP.handleError;

      // display list of whishkey in db
      //   APP.orderedBuildList();
      APP.buildList();
    };

    request.onupgradeneeded = (ev) => {
      APP.db = ev.target.result; // for using database later
      let store = null;

      // create stores
      if (!APP.db.objectStoreNames.contains("whishkeyStore")) {
        store = APP.db.createObjectStore("whishkeyStore", {
          keyPath: "id",
        });

        // creating indexes
        // unique specify whether to add unique constraint on the key on not
        // in simple term allowing duplicate values or not
        store.createIndex("nameIDX", "name", { unique: false });
        store.createIndex("countryIDX", "name", { unique: false });
        store.createIndex("ageIDX", "name", { unique: false });
      }
    };

    request.onerror = APP.handleError;
  },

  handleError(err) {
    console.warn(err);
  },

  addEvents: function () {
    document.querySelector(".add").addEventListener("click", APP.addWhishkey);
    document.querySelector(".list").addEventListener("click", APP.EditWhishkey);
    document
      .querySelector(".update")
      .addEventListener("click", APP.updateWhishkey);
    document.querySelector(".clear").addEventListener("click", APP.clearForm);
    document
      .querySelector(".delete")
      .addEventListener("click", APP.deleteWhishkey);
  },

  deleteWhishkey(ev) {
    ev.preventDefault();

    // this time using get operation

    let key = document.forms[0].dataset.key;
    if (!key) {
      return;
    }

    let whishkey = APP.getAllValues();
    whishkey.id = key;

    APP.db
      .transaction("whishkeyStore", "readwrite")
      .objectStore("whishkeyStore")
      .delete(key).onsuccess = (ev) => {
      console.log(ev.target.result, "updated successfully");
    };

    APP.buildList();
    APP.clearForm();
  },

  updateWhishkey(ev) {
    ev.preventDefault();
    let key = document.forms[0].dataset.key;
    if (!key) {
      return;
    }

    let whishkey = APP.getAllValues();
    whishkey.id = key;

    APP.db
      .transaction("whishkeyStore", "readwrite")
      .objectStore("whishkeyStore")
      .put(whishkey).onsuccess = (ev) => {
      console.log(ev.target.result, "updated successfully");
    };

    APP.buildList();
    APP.clearForm();
  },

  EditWhishkey(ev) {
    let target = ev.target.closest("[data-key]");
    if (!target) {
      return;
    }

    let key = target.dataset.key;

    // let's get the whishkey via cursor object
    let transaction = APP.db.transaction("whishkeyStore", "readonly");
    let store = transaction.objectStore("whishkeyStore");

    let keyRange = IDBKeyRange.only(key);
    let cursor = store.openCursor(keyRange);

    cursor.onsuccess = (ev) => {
      let cursor = ev.target.result;

      if (cursor) {
        let whishkey = cursor.value;
        // fill the form
        document.getElementById("name").value = whishkey.name;
        document.getElementById("age").value = whishkey.age;
        document.getElementById("country").value = whishkey.country;
        document.getElementById("isOwned").checked = whishkey.isOwned;

        // add key on the form to have for update click
        document.forms[0].setAttribute("data-key", whishkey.id);
      }
    };
  },

  addWhishkey(ev) {
    ev.preventDefault(); // prevent the default behaviour of a form button
    // validation
    if (!APP.validate()) {
      // donot add;
      return;
    }
    let whishkey = APP.getAllValues();

    // add id property which will act as primary key for our object
    whishkey.id = APP.uid();

    // all the operation on indexedDB database are always wrapped around transaction object
    let transaction = APP.db.transaction("whishkeyStore", "readwrite");

    transaction.oncomplete = (ev) => {
      console.log("transaction successfull completed");
    };
    console.log(whishkey);

    let store = transaction.objectStore("whishkeyStore");
    let rqst = store.add(whishkey);

    rqst.onsuccess = (ev) => {
      console.log(ev.target.result, "successfully added");
      APP.buildList();
    };
  },

  validate() {
    let whishkey = APP.getAllValues();
    if (whishkey.name && whishkey.age && whishkey.country) {
      return true;
    }
    return false;
  },

  getAllValues() {
    let name = document.getElementById("name").value.trim();
    let age = document.getElementById("age").value.trim();
    let country = document.getElementById("country").value.trim();
    let isOwned = document.getElementById("isOwned").checked;

    return { name, age, country, isOwned };
  },

  // the function will create unique id for my primary key
  uid() {
    let one = Date.now().toString(36).toLocaleUpperCase();
    let two = Math.random()
      .toString(36)
      .slice(2)
      .padStart(12, "x")
      .toUpperCase();
    return "".concat(one, "-", two);
  },

  buildList() {
    let rqst = APP.db
      .transaction("whishkeyStore", "readonly")
      .objectStore("whishkeyStore")
      .getAll();
    rqst.onsuccess = (ev) => {
      let result = ev.target.result;
      let list = document.querySelector(".list");
      list.innerHTML = result
        .map((whishkey) => {
          return `<p data-key=${whishkey.id}>${whishkey.name} ${whishkey.isOwned} ${whishkey.country} ${whishkey.age}</p>`;
        })
        .join("\n");
    };
  },

  clearForm(ev) {
    if (ev) {
      ev.preventDefault(); // prevent submission of form
    }

    document.forms[0].reset();
    document.forms[0].removeAttribute("data-key");
  },

  orderedBuildList() {
    // the function will use index instead of store and will order the list in desc order as well

    let store = APP.db
      .transaction("whishkeyStore", "readonly")
      .objectStore("whishkeyStore");
    let index = store.index("nameIDX");
    let list = document.querySelector(".list");

    let cursor = index.openCursor(null, "prev");
    list.innerHTML = "";

    cursor.onsuccess = (ev) => {
      let cursor = ev.target.result;
      if (cursor) {
        list.innerHTML += `<p>${cursor.value.name}</p>`;
        cursor.continue();
      }
    };
  },
};

document.addEventListener("DOMContentLoaded", APP.init);
