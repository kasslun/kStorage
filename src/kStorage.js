/*!
 * 本地存储框架kStorgae v1.0
 * 说明：本文件不支持IE6-7。需要支持IE6-7，请用kStorage.full.min.js文件
 *
 * 开发日期: 2013-11-5
 * 依赖:无
 * 全局变量：kStorage, kst;
 * 项目地址: https://github.com/kasslun/kStorage/
 * 详细说明: http://kasslun.github.io/kStorage/
 */
/*
 * 核心对象，以及localStorage支持
 */
;(function (win) {
    "use strict";
    if(win.kStorage) {
        return;
    }
    var defaultAge = 0, maxAge = Number.MAX_VALUE,
        noop = function () {},
        kStorage = win.kst = win.kStorage = {
            VERSION: "1.0",
            type: "none",
            support: true,
            use: null,
            info: noop,
            destroy: noop
        },
        ls = win.localStorage,
        typeStr = "[object Storage]",
        type, tool,
        doc = win.document,
        JSON = win.JSON || {},
        cookieRegExp;
    defaultAge = Math.min(defaultAge, 7);
    /**
     * 判断浏览器支持
     */
    if (typeof ls === "object") {
        //FF,Chrome,Safari,Opera
        if (typeof ls.toString === "function") {
            type = ls.toString();
        }
        //IE8
        if (type !== typeStr && ls.constructor) {
            type = ls.constructor.toString();
        }
    }
    //设置存储类型属性
    if (type === typeStr) {
        kStorage.type = "storage";
    } else if(doc.documentElement.addBehavior) {
        kStorage.type = "userData";
    }
    //设置tool
    tool = kStorage._tool = {
        dA: defaultAge,
        mA: maxAge,
        coreToString: Object.prototype.toString,
        storage : win.localStorage,
        /**
         * 初始化对象
         * @param obj
         */
        initObj: function (obj) {
            delete obj._data;
            delete obj._info;
            //空函数
            obj.set = obj.remove = obj.clear = function () {return this;};
            obj.get = obj.count = function () {};
            return obj;
        },
        error : function (msg) {
            throw Error(msg);
        },
        /**
         * 获取数据id
         * @param storageId
         * @returns {string}
         */
        getStorageName : function (storageId) {
            if (typeof storageId !== "string" ||
                !/^\w+$/g.test(storageId)) {
                //storageId由字母，数字和下划线组成
                this.error("storageId Must be made by letter, numbers and underline");
            }
            return "cs_" + storageId + "_";
        },
        /**
         * 验证属性名
         * @param name
         */
        filterName: function (name) {
            if (typeof name !== "string") {
                //参数name应该为字符串
                this.error("arg 'name' must be a string");
            }
        },
        /**
         * 获取过期时间
         * @param days
         * @returns {string}
         */
        getExpiresDate: function (days) {
            var exp  = new Date();
            exp.setTime(exp.getTime() + days * 86400000);
            return exp.toUTCString();
        },
        /**
         * 生成一个短随机数
         * @returns {number}
         */
        random: function () {
            return Math.random().toString().substring(2, 10) - 0;
        },
        /**
         * 修正过期时间参数
         * @param days
         * @returns {*}
         */
        fixMaxAge: function (days) {
            var type = typeof days;
            if (type === "number") {
                days = days < 0 ? 0 : days;
                return Math.min(parseInt(days, 10), this.mA);
            }
        },
        stringifyJSON: JSON.stringify,
        parseJSON: JSON.parse
    };
    /**
     * 公共方法,用于原型的一个拷贝
     * @private
     */
    kStorage._publicMethods = {
        /**
         * 设置值,确定值
         * @param name
         * @param value
         * @returns {*}
         */
        set: function (name, value) {
            var p, data, stringifyJSON, v, changed;
            tool.updateData(this);
            data = this._data;
            if (typeof data === "object") {
                //设置多个值，name为对象
                stringifyJSON = tool.stringifyJSON;
                if (tool.coreToString.call(name) === "[object Object]") {
                    for (p in name) {
                        if (name.hasOwnProperty(p)) {
                            v = name[p];
                            if (v === undefined) {
                                //undefined 删除值
                                if (data[p] !== undefined) {
                                    changed = true;
                                    delete data[p];
                                }
                            } else {
                                v = stringifyJSON(v);
                                //判断是否重复设置值
                                if (data[p] !== v) {
                                    changed = true;
                                    data[p] = v;
                                }
                            }
                        }
                    }
                } else {
                    tool.filterName(name);
                    if (value === undefined) {
                        //undefined 删除值
                        if (value !== data[name]) {
                            changed = true;
                            delete data[name];
                        }
                    } else {
                        value = stringifyJSON(value);
                        //判断是否重复设置值
                        if (value !== data[name]) {
                            changed = true;
                            data[name] = value;
                        }
                    }
                }
                //如有改变，则设置到存储中
                if (changed) {
                    tool.setData(this);
                }
            }
            return this;
        },
        /**
         * 获取值
         * @param name
         * @returns {*}
         */
        get: function (name) {
            var data, value;
            tool.updateData(this);
            tool.filterName(name);
            data = this._data;
            if (typeof data === "object") {
                value = data[name];
                if (value !== undefined) {
                    return tool.parseJSON(value);
                }
            }
        },
        /**
         * 获取多少条数据
         * @returns {*}
         */
        count: function () {
            var p, data, length;
            tool.updateData(this);
            data = this._data;
            if (typeof data === "object") {
                length = 0;
                for (p in data) {
                    length++;
                }
                return length;
            }
        },
        /**
         * 移除属性
         * @param name
         */
        remove: function (name) {
            var data;
            tool.updateData(this);
            tool.filterName(name);
            data = this._data;
            if (typeof data === "object" && data[name] !== undefined) {
                delete data[name];
                tool.setData(this);
            }
            return this;
        },
        /**
         * 清除内容
         * @returns {*}
         */
        clear: function () {
            tool.updateData(this);
            if (typeof this._data === "object") {
                this._data = {};
                tool.setData(this);
            }
            return this;
        },
        /**
         * 设置最大时间
         * @param days
         */
        setMaxAge: function (days) {
            days = tool.fixMaxAge(days);
            if (days !== undefined) {
                tool.updateData(this);
                if (this._info) {
                    this._info.a = days;
                    tool.setInfo(this);
                }
            }
        },
        /**
         * 获取最大时间
         * @returns {*}
         */
        getMaxAge: function () {
            tool.updateData(this);
            if (this._info) {
                return this._info.a;
            }
        }
    };
    /**
     * 如果浏览器不支持存储，采用一个默认的对象，支持设置cookie
     */
    if (kStorage.type !== "none") {
        cookieRegExp = /cs_kStorage_=1/;
        //设置一个cookie
        //模拟cookie以及过期管理用到
        if (!cookieRegExp.test(doc.cookie)) {
            doc.cookie = "cs_kStorage_=1;path=/";
            kStorage._firstLoad = true;
        }
    } else {
        kStorage.support = false;
        kStorage.use = function () {
            return kStorage._tool.initObj({});
        };
    }
})(window);

/**
 * storage方法创建存储
 */
(function (win) {
    "use strict";
    var kStorage = win.kStorage, tool,
        storage, storageCache, infoSuffix;
    if (kStorage.type !== "storage") {
        return;
    }
    tool = kStorage._tool;
    storage = tool.storage;
    storageCache = {};
    infoSuffix = "i";
    /**
     * local创建法，如果存在就加载，否则就创建。
     * @param storageId
     * @param maxAge
     * @returns {*}
     */
    kStorage.use = function (storageId, maxAge) {
        var storageName = tool.getStorageName(storageId),
            info;
        if (storageCache[storageName]) {
            //防止重复 use()
            return storageCache[storageName];
        }
        if (tool.createCallBack) {
            tool.createCallBack(storageId);
        }
        info = tool.getItem(storageName + infoSuffix);
        if (info) {
            //如果存在则加载
            storageCache[storageName] = new Data(storageName, undefined, false);
            return storageCache[storageName];
        }
        //否则创建
        storageCache[storageName] = new Data(storageName, tool.fixMaxAge(maxAge), true);
        return storageCache[storageName];
    };
    /**
     * 判断存储是否存在
     * @param storageId
     */
    kStorage.exists = function (storageId) {
        return !!this.info(storageId);
    };
    /**
     * 获取数据信息
     * @param storageId
     * @returns {*}
     */
    kStorage.info = function (storageId) {
        var storageName = tool.getStorageName(storageId),
            info = tool.getItem(storageName + infoSuffix);
        if (info) {
            return info;
        }
        return null;
    };
    /**
     * 销毁存储
     * @param storageId
     */
    kStorage.destroy = function (storageId) {
        var storageName = tool.getStorageName(storageId),
            currCache = storageCache[storageName];
        storage.removeItem(storageName);
        storage.removeItem(storageName + infoSuffix);
        if (currCache) {
            //替换方法,进行初始化
            tool.initObj(currCache);
            delete storageCache[storageName];
        }
    };
    /**
     * 创建data的构造函数
     * @param storageName
     * @param maxAge
     * @param create
     * @constructor
     */
    function Data (storageName, maxAge, create) {
        var time = new Date().getTime();
        this._storageName = storageName;
        if (create) {
            this._data = {};
            this._info = {
                d: time,
                a: maxAge === undefined ? tool.dA : maxAge
            };
            tool.setData(this);
        } else {
            this._data = tool.getItem(storageName) || {};
            this._info = tool.getItem(storageName + infoSuffix);
            //更新过期时间
            this._info.d = time;
            tool.setInfo(this);
        }
    }
    /**
     * 原型方法
     */
    Data.prototype = kStorage._publicMethods;
    /**
     * 设置data
     * @param obj
     */
    tool.setData = function (obj) {
        try {
            storage.setItem(obj._storageName, this.stringifyJSON(obj._data));
        } catch(e) {}
        obj._info.s = this.random();
        this.setInfo(obj);
    };
    /**
     * 设置info
     * @param obj
     */
    tool.setInfo = function (obj) {
        storage.setItem(obj._storageName + infoSuffix, this.stringifyJSON(obj._info));
    };
    /**
     * 更新最新数据
     * @param obj
     */
    tool.updateData = function(obj) {
        var storageName = obj._storageName, info = obj._info,
            latestInfo = tool.getItem(storageName + infoSuffix);
        if (!latestInfo) {
            //被销毁了
            obj._data = obj._info = undefined;
        } else if(!info || info.s !== latestInfo.s) {
            //数据不是最新，获取最新
            obj._data = tool.getItem(storageName) || {};
            obj._info = latestInfo;
        }
    };
    /**
     * 获取存储对象，数据部分丢失保护
     * @param name
     * @returns {{}}
     */
    tool.getItem = function (name) {
        var ret;
        try {//数据部分丢失保护，以防报错
            ret = this.parseJSON(storage.getItem(name));
        } catch(e) {}
        return ret;
    };
})(window);

/**
 * cookie扩展,可单独删除
 */
(function (kStorage) {
    "use strict";
    var cookie, session, tool, data, p, v,
        currTime, removeAttr;
    if (!kStorage.support) {
        return;
    }
    tool = kStorage._tool;
    cookie = kStorage.use("_kStorageCookieManager", 90);
    data = cookie._data;
    if (kStorage._firstLoad) { //当天第一次启动
        //清除session
        kStorage.destroy("_kStorageSessionManager");
        //清除cookie中过期值
        currTime = new Date().getTime();
        for (p in data) {
            v = tool.parseJSON(data[p]);
            if(v && v[1] && v[1] < currTime) {
                delete data[p];
            }
        }
        tool.setData(cookie);
    }
    session = kStorage.use("_kStorageSessionManager", 90);
    /**
     * 移除属性
     * @param name
     */
    removeAttr = function (name) {
        cookie.remove(name);
        session.remove(name);
    };
    kStorage.cookie = {
        /**
         * 设置cookie
         * @param name
         * @param value
         * @param expires
         * @returns {*}
         */
        set: function (name, value, expires) {
            var type, currTime;
            tool.filterName(name);
            if (value === undefined) {
                //删除cookie
                removeAttr(name);
                return this;
            }
            if (expires === undefined) {
                //没有设置时间则设置为session
                cookie.remove(name);
                session.set(name, value);
                return this;
            }

            type = tool.coreToString.call(expires).slice(8, -1);
            currTime = new Date().getTime();
            if (type === "Number") {
                if (expires <= 0) {
                    //时间为过去
                    removeAttr(name);
                } else {
                    //删除session中同样的属性
                    session.remove(name);
                    cookie.set(name, [value, currTime + expires]);
                }
            } else if (type === "Date") {
                expires = expires.getTime();
                //设置的是过期时间
                if (expires <= currTime) {
                    removeAttr(name);
                } else {
                    //删除session中同样的属性
                    session.remove(name);
                    cookie.set(name, [value, expires]);
                }
            } else {
                tool.error("arg expires error")
            }
            return this;
        },
        /**
         * 获取cookie
         * @param name
         * @returns {*}
         */
        get: function (name) {
            var d;
            tool.filterName(name);
            d = cookie.get(name);
            if (d) {
                //判断是否过期
                if (d[1] && d[1] < new Date().getTime()) {
                    cookie.remove(name);
                    return;
                }
                return d[0];
            } else {
                return session.get(name);
            }
        },
        /**
         * 删除cookie
         * @param name
         */
        remove: function (name) {
            tool.filterName(name);
            removeAttr(name);
            return this;
        }
    };

})(window.kStorage);

/**
 * 过期管理，可被删除
 */
(function (win) {
    "use strict";
    var kStorage = win.kStorage,
        currTime, ls,
        kStorageCreateManager, nameList, p, info;
    if (!kStorage.support) {
        return;
    }
    if (kStorage._firstLoad) { //当天第一次启动
        kStorageCreateManager = kStorage.use("_kStorageCreateManager");
        nameList = kStorageCreateManager.get("nameList");
        currTime = new Date().getTime();
        if (typeof nameList === "object") {
            for (p in nameList) {
                info = kStorage.info(p);
                if (!info || //info无效
                    info.a === 0 || //重启删除
                    currTime > info.d + info.a * 86400000) { //过期时间到期
                    kStorage.destroy(p);
                    delete nameList[p];
                }
            }
            kStorageCreateManager.set("nameList", nameList);
        } else if (kStorage.type === "storage"){
            //storage遍历删除。
            ls = win.localStorage;
            for (p in ls) {
                p = /^cs_(\w{8,})_$/.exec(p);
                if (p) {
                    p = p[1];
                    info = kStorage.info(p);
                    if (!info || //info无效
                        info.a === 0 || //重启删除
                        currTime > info.d + info.a * 86400000) { //过期时间到期
                        kStorage.destroy(p);
                    }
                }
            }
        }
    }
})(window);
/**
 * ID列表保存，用于过期管理
 */
(function (win) {
    "use strict";
    var kStorage = win.kStorage,
        kStorageCreateManager,
        nameList;
    if (!kStorage.support) {
        return;
    }
    kStorageCreateManager = kStorage.use("_kStorageCreateManager", 90);
    //创建时的回调
    kStorage._tool.createCallBack = function (storageId) {
        nameList = kStorageCreateManager.get("nameList") || {};
        if (!nameList[storageId]) {
            nameList[storageId] = 1;
            kStorageCreateManager.set("nameList", nameList);
        }
    };
})(window);
