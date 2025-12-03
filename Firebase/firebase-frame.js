import {set, get, ref,update, push, child, getUID, onChildAdded, onChildRemoved, onChildChanged, onValue, storageRef, uploadFileToCloud} from "./firebase-client.js"

/** 
 * @typedef {Object} UploadTaskSnapshot
 * @property {number} bytesTransferred	The number of bytes that have been successfully uploaded so far.
 * @property {Object} metadata	Before the upload completes, contains the metadata sent to the server. After the upload completes, contains the metadata sent back from the server.
 * @property {Object}  ref	The reference that spawned this snapshot's upload task.
 * @property {string}  state	The current state of the task.
 * @property {Object}  task	The task of which this is a snapshot.
 * @property {number} totalBytes The total number of bytes to be uploaded.
 */

/**
 * @param {String} appName
 * @param {Object} app
 */
let FirebaseFrames = [];
export class FirebaseFrame {
    constructor(reference) {
        this.reference = reference;
        this.appRef = (path) => {
          let r = ref(reference);
          if (typeof path === "string") r = child(r, path);
          return r;
        }
        this.getStoragePath = (path) => {
          let fname = reference;
          if (typeof path === "string") fname += "/" + path;
          return fname;
        }

        this.listeners = new Set();
        FirebaseFrames.push(this);

    }
  

  
    /** get, gets a value in the apps database at the path specified.
     * 
     * @param {String} path the path in the database you want to access if no 
     *                      path is provided then the app's root directory is fetched.
     * @return {Promise<DataValue>} returns a promise that resolves the value in the database.
     */
    async get(path){ 
          let ref =  this.appRef(path);
        try {
            return (await get(ref)).val()
        } catch (e) {
            e.message += " getting: " + ref._path.pieces_.join("/")
            throw e
        }
    }
  
  
    /** set, sets a value in the apps database at the path specified.
     * @param {String} path same as with get.
     * @return {Promise<void>} returns a promise that resolves nothing once setting has been completed.
     * 
     */
    async set(path, value) {
      await set(this.appRef(path), value)
    }

    /** update, updates a value in the apps database at the path specified.
     * @param {String} path same as with get.
     * @return {Promise<void>} returns a promise that resolves nothing once setting has been completed.
     * 
     */
    async update(path, value) {
      await update(this.appRef(path), value)
    }
  
  
    /** push, gets a new push key for the path at the database
     * 
     * @param {String} path same as with get.
     * @return {String} returns the key to push a new value.
     */
    push(path, value) {
        let pr = push(this.appRef(path));
        return pr.key;
    }


    /** pushSet, gets a new push key for the path at the database
     *  and sets the location to the given value.
     * 
     * @param {String} path same as with get.
     * @param {Object|string|number|null} value value to set
     * 
     * @return {Promise<void>} returns the key to push a new value.
     */
    async pushSet(path, value) {
        let pr = push(this.appRef(path));
        await set(pr, value);
    }
  
    /** An onValue event will trigger once with the initial data stored at this location, and then trigger
     *  again each time the data changes. The value passed to the callback will be for the location at which
     *  path specifies. It won't trigger until the entire contents has been synchronized. If the location has
     *  no data, it will be triggered with a null value.
     * 
     * @param {String} path same as with get.
     * @param {(value: DataValue) => void} callback a function that will be called at the start 
     *                                                        and for every change made.
     */
    onValue(path, cb) {
        let close = null;
        if (cb instanceof Function) {
            close = onValue(this.appRef(path), (sc) => cb(sc.val()));
            this.listeners.add(close)
        } else {
            throw "The callback must be a function"
        }
        return () => {
            this.listeners.delete(close);
            close();
        };
    
    }
  
    /** An onChildAdded event will be triggered once for each initial child at this location, and it will be 
     *  triggered again every time a new child is added. The value passed into the callback will reflect
     *  the data for the relevant child. It is also passed a second parameter the key of the child added.
     *  For ordering purposes, it is passed a third argument which is a string containing the key of the
     *  previous sibling child by sort order, or null if it is the first child.
     * 
     * @param {String} path same as with get.
     * @param {(value: DataValue, key: String, previousKey: String) => void} callback 
     */
    onChildAdded(path, cb) {
        let close = null;
        if (cb instanceof Function) {
            close = onChildAdded(this.appRef(path), (sc, key) => cb(sc.val(), sc.key, key));
            this.listeners.add(close)
        } else {
            throw "The callback must be a function"
        }
        return () => {
            this.listeners.delete(close);
            close();
        };
    }
  
    /** An onChildRemoved event will be triggered once every time a child is removed. 
     *  The value passed into the callback will be the old data for the child that was removed.
     *  A child will get removed when it is set null. It is also passed a second parameter the 
     * key of the child removed.
     * 
     * @param {String} path same as with get.
     * @param {(value: DataValue, key: String) => void} callback
     */
    onChildRemoved(path, cb) {
        let close = null;
        if (cb instanceof Function) {
            close = onChildRemoved(this.appRef(path), (sc) => cb(sc.val(), sc.key));
            this.listeners.add()
        } else {
            throw "The callback must be a function"
        }
        return () => {
            this.listeners.delete(close);
            close();
        };
    }
  
    /** An onChildChanged event will be triggered initially and when the data stored in a child 
     * (or any of its descendants) changes. Note that a single child_changed event may represent 
     * multiple changes to the child. The value passed to the callback will contain the new child 
     * contents. It is also passed a second parameter the key of the child added. For ordering 
     * purposes, the callback is also passed a third argument which is a string containing the 
     * key of the previous sibling child by sort order, or null if it is the first child.
     * @param {String} path same as with get.
     * @param {(value: DataValue, key: String, previousKey: String) => void} callback
     */
    onChildChanged(path, cb) {
        let close = null;
        if (cb instanceof Function) {
          close = onChildChanged(this.appRef(path), (sc, key) => cb(sc.val(), sc.key, key));
          this.listeners.add(close)
        } else {
          throw "The callback must be a function"
        }
        return () => {
          this.listeners.delete(close);
          close();
        };
    }

    /** Upload file to firebase storage bucket.
     * 
     * @param {File} file the actual file to be uploaded.
     * @param {string} path path of the file to be uploaded (relative to the frame).
     * @param {(UploadTaskSnapshot) => void} statusCallback called on progoress updates of the upload.
     * @param {Object} metadata metedata of the file being uploaded
     * @param {boolean} getURL whether to get a download url after upoading is complete.
     * 
     * @return {Promise<string?>} returns download url or null if not specified.
    */
    async uploadFile(file, path, statusCallback, metadata, getURL = true) {
      return await uploadFileToCloud(file, this.getStoragePath(path), statusCallback, metadata, getURL);
    }
  
    /** Ends all listeners and removes the app database */
    close(remove = true) {
        for (let listener of this.listeners) {
          if (listener instanceof Function ) {
            listener();
          }
        }
        if (remove) set(this.appRef(), null);
    }
  
    get uid(){
      return getUID();
    }

    get rootPath() {
      return this.reference;    
    }
}



export class DummyFrame {
    constructor() {
        this.data = {};
        this.callbacks = [];
    }

    async uploadFile(file, path, statusCallback, metadata, getURL = true) {
        let fileReader = new FileReader();
        return new Promise((resolve, reject) => {
            fileReader.onload = () => {
                // return data URL
                let dataURL = fileReader.result;
                this.set(path, dataURL);
                resolve(getURL ? dataURL : null);
            };
            fileReader.readAsDataURL(file);
        })
    }

    get(key) {
        let path = key.split("/");
        let obj = this.data;
        for (let part of path) {
            if (obj && part in obj) {
                obj = obj[part];
            } else {
                return undefined;
            }
        }
        return obj;
    }

    set(key, value) {
        let path = key.split("/");
        let obj = this.data;
        for (let i = 0; i < path.length; i++) {
            let part = path[i];
            if (i === path.length - 1) {
                obj[part] = value;
            } else {
                if (!(part in obj)) {
                    obj[part] = {};
                }
                obj = obj[part];
            }
        }

        for (let {key: cbKey, callback} of this.callbacks) {
            if (cbKey.startsWith(key) || key === cbKey) {
                callback(this.get(cbKey));
            }
        }
    }

    onValue(key, callback) {
        // Dummy implementation
        callback(this.get(key));
        this.callbacks.push({key, callback});
    }

}
