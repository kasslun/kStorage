/*!
 * 本地自动完成
 * https://github.com/kasslun/kStorage
 * 开发日期: 13-11-15
 * 依赖:本地存储框架kStorage, kst
 */

/**
 * 基于kStorage的本地自动完成扩展
 */
;(function (win) {
    "use strict";
    if (!win.kst || !win.kst.support || win.kst.autocomplete === "off") {
        return;
    }
    var kst = win.kst || win.kStorage,
        isLtIe8, isTopLtIe8,
        doc = win.document,
        html = doc.getElementsByTagName("html")[0],
        body = doc.getElementsByTagName("body")[0],
        autoCompleteData = kst.use("_autoCompleteData", 360),
        maxLength = 1000,
        //来自jq
        trim = String.prototype.trim ? function( text ) {
            return String.prototype.trim.call( text );
        } : function( text ) {
            return (text).replace( /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "" );
        },
        _localautocomplete,
        //绑定事件兼容方法
        bind = doc.addEventListener ? function (ele, type, handler) {
            ele.addEventListener(type, handler);
        } : function (ele, type, handler) {
            ele.attachEvent("on" + type, function () {
                handler.call(ele);
            });
        },
        //查元素是否存在border，包括css样式以及行内样式
        curBottomstyle =  function (ele) {
            var css = ele.style.cssText || "",
                height;
            ele.style.cssText = css + ";border-bottom-width:0;";
            height = ele.offsetHeight;
            ele.style.cssText = css;
            return ele.offsetHeight !== height;
        },
        //取消默认
        preventDefault = function (e) {
            if (e.preventDefault) {
                e.preventDefault();
            } else {
                e.returnValue = false;
            }
        };
    //判断浏览器是否低于IE8，根据type="userData"判断
    isLtIe8 = kst.type === "userData";
    isTopLtIe8 = isLtIe8 && parent.location === win.location;
    _localautocomplete = {
        init: function () {
            this.createDom();
            this.findInput();
            this.positionChangeEvent();
        },
        /**
         * 创建下拉框，并绑定事件
         */
        createDom: function () {
            var self = this,
                box = this.box = document.createElement("div"),
                inner = this.inner = document.createElement("div");
            box.id = "kst-localautocomplete";
            if (isLtIe8) {
                //IE6,7需要用iframe挡住selset
                box.innerHTML = '<iframe scrolling="no"></iframe>';
                inner.className = "kst-localautocomplete-inner";
            }
            box.appendChild(inner);
            body.appendChild(box);
            //鼠标over事件
            bind(box, "mouseover", function (event) {
                var e = event || win.event,
                    target = e.target || e.srcElement,
                    tagName = target.tagName,
                    list, index;
                if (tagName === "DIV") {
                    return;
                }
                if (tagName !== "SPAN") {
                    target = target.parentNode;
                }
                list = self.list;
                index = self.index;
                if (list[index]) {
                    list[index].className = "";
                }
                target.className = "kst-localautocomplete-checked";
                self.index = target.getAttribute("index") - 0;
            });
            //mousedown
            bind(box, "mousedown", function (event) {
                if (event) {
                    event.preventDefault();
                } else {
                    self.isDown = true;
                }
            });
            //mouseup
            bind(box, "mouseup", function (event) {
                var e = event || win.event,
                    target = e.target || e.srcElement,
                    currEle = self.currEle,
                    index = self.index;
                if (target.tagName === "A") {
                    //删除按钮
                    self.removeData(index);
                    currEle.focus();
                    return;
                }
                currEle.value = self.text[index];
                self.hideBox();
            });
        },
        /**
         * 查找页面所有text类型的input
         */
        findInput: function () {
            var self = this,
                inputs = doc.getElementsByTagName("input"),
                i, len, type, inputsI, autoComplate;
            for (i = 0, len = inputs.length; i < len; i++) {
                inputsI = inputs[i];
                type = inputsI.getAttribute("type");
                autoComplate = inputsI.getAttribute("autocomplete");
                //对于无type，或者type为text的input
                //且没有设置autoComplate
                //非readonly和disabled
                if ((!type || type.toLowerCase() === "text") &&
                    (!autoComplate || autoComplate.toLowerCase() !== "off")) {
                    inputsI.setAttribute("autocomplete", "off");
                    bind(inputsI, "focus", focusHandler);
                    bind(inputsI, "blur", blurHandler);
                    bind(inputsI, "keydown", keydownHandler);
                    bind(inputsI, "keyup", keyupHander);
                }
            }
            /**
             * 获取焦点回调
             */
            function focusHandler() {
                if (!self.isEffective(this)) {
                    return;
                }
                //显示下拉定位的元素
                self.currEle = this;
                //获取数据
                self.data = autoCompleteData.get("data") || [];
            }
            /**
             * 失去焦点的回调
             */
            function blurHandler() {
                if (!self.isEffective(this)) {
                    return;
                }
                if (self.isDown) {
                    this.focus();
                    self.isDown = false;
                    return;
                }
                var value = trim(this.value),
                    length = value.length;
                if (length > 1 && length < 21) {
                    if (this.data) {
                        self.updateData(value);
                    }
                }
                self.hideBox();
            }
            /**
             * 按键回调
             * @param event
             */
            function keydownHandler(event) {
                var e = event || win.event,
                    keyCode, list, index, size;
                if (!self.isEffective(this) || !self.isShow) {
                    return;
                }
                keyCode = e.keyCode;
                list = self.list;
                index = self.index;
                size = self.size;
                switch(keyCode) {
                    case 40 : //下
                        list[index].className = "";
                        list[ self.index = (index + 1) % size ]
                            .className = "kst-localautocomplete-checked";
                        preventDefault(e);
                        break;
                    case 38 : //上
                        list[index].className = "";
                        list[ self.index = (index - 1 + size) % size ]
                            .className = "kst-localautocomplete-checked";
                        preventDefault(e);
                        break;
                    case 13 : //enter
                        this.value = self.text[index];
                        self.hideBox();
                        break;
                }
            }

            /**
             * 输入时匹配数据
             */
            function keyupHander(event) {
                if (!self.isEffective(this) || (event || win.event).keyCode === 13 || self.valueCache === this.value) {
                    //上下按钮和回车
                    return;
                }
                self.valueCache = this.value;
                var currEle = self.currEle,
                    data, i, len, v,
                    html, html1, cont, cont1, text, text1,
                    dataI, span;
                if (currEle) {
                    v = currEle.value;
                    if (v) {
                        html = [];
                        html1 = [];
                        text = [];
                        text1 = [];
                        data = self.data;
                        cont = 0;
                        cont1 = 0;
                        //匹配输入，并组合下拉内容字符串
                        for (i = 0, len = data.length; i < len && cont < 10; i++) {
                            dataI = data[i];
                            if (dataI === v) {
                                continue;
                            }
                            span = ['<span>',
                                dataI.replace(v, '<em>' + v + '</em>'),
                                '<a href="javascript:;" hidefocus="true"></a></span>'
                            ].join("");
                            if (dataI.indexOf(v) === 0) {
                                cont++;
                                text.push(dataI);
                                html.push(span);
                            } else if (dataI.indexOf(v) > 0) {
                                cont1++;
                                text1.push(dataI);
                                html1.push(span);
                            }
                        }
                        //优先第一个字匹配成功的
                        if (cont + cont1) {
                            if (cont < 9) {
                                html = html.concat(html1);
                                text = text.concat(text1);
                            }
                            self.text = text;
                            self.showBox(html);
                            return;
                        }
                    }
                    self.hideBox();
                }
            }
        },
        /**
         * 判断当前input是否应该有下拉
         */
        isEffective: function (input) {
            return !input.getAttribute("readonly") && !input.getAttribute("disabled");
        },
        /**
         * 更新数据，2-20个字符，最多1000个
         * @param value
         */
        updateData: function (value) {
            var data = this.data,
                len = data.length, i;
            for (i = 0; i < len; i ++) {
                if (data[i] === value) {
                    data.splice(i, 1);
                    break;
                }
            }
            data.unshift(value);
            if (data.length > maxLength) {
                data.length = maxLength;
            }
            autoCompleteData.set("data", data);
        },
        /**
         * 显示位置
         */
        showBox: function (html) {
            var box = this.box,
                inner = this.inner,
                innerClass = inner.className || "",
                obj = this.setLayout(html.length),
                list, i, len;
            if (!obj.size) {
                return;
            }
            this.size = html.length = obj.size;
            inner.innerHTML = html.join("");
            list = this.list = inner.getElementsByTagName("span");
            //设置index属性
            for (i = 0, len = this.size; i < len; i++) {
                list[i].setAttribute("index", i + "");
            }
            list[0].className = "kst-localautocomplete-checked";
            //设置宽度
            inner.className = innerClass + " kst-localautocomplete-auto";
            box.style.width = "";
            box.style.width = Math.max(inner.offsetWidth, obj.width) + "px";
            inner.className = innerClass;
            this.index = 0;
            this.isShow = true;
        },
        /**
         * 隐藏下拉框
         */
        hideBox: function () {
            if (!this.isShow) {
                return;
            }
            this.box.style.left = "-99999999px";
            this.isShow = false;
            this.valueCache = undefined;
        },
        /**
         * 下拉位置和宽高
         */
        setLayout: function (count) {
            var currEle = this.getEeferenceEle(this.currEle),
                box = this.box,
                offset = isTopLtIe8 ? 2 : 0, //在IE6-7非Iframe中，有2px差异
                borderSize = 2, //边框宽度
                lineHeight = 25, //行高
                maxHeight = 252, //最大高度
                maxWidth = 275, //最大宽度
                inputHeight = currEle.offsetHeight,
                inputWidth = currEle.offsetWidth,
                rect = currEle.getBoundingClientRect(),
                //顶部空间
                topSpace = rect.top - offset + (html.scrollTop || body.scrollTop),
                //下部空间
                bottomSpace = Math.max.apply(null, [
                    html.clientHeight && html.scrollHeight,
                    body.clientHeight,
                    body.scrollHeight,
                    html.clientHeight
                ]) - topSpace - inputHeight,
                //左边空间
                leftSpace = rect.left - offset + (html.scrollLeft || body.scrollLeft),
                //右边空间
                rightSpace = Math.max.apply(null, [
                    html.clientWidth && html.scrollWidth,
                    body.clientWidth,
                    body.scrollWidth,
                    html.clientWidth
                ]) - leftSpace - inputWidth,
                top, size = Math.min(10, count);
            if ( maxHeight < bottomSpace) {
                //下面有空间显示在下面
                top = topSpace + inputHeight;
                this.showTop = false;
            } else if (maxHeight < topSpace){
                //上面有空间，显示在上面
                top = topSpace - size * lineHeight - borderSize;
                this.showTop = true;
            } else {
                //上下空间不够，则判断上下空间大小。
                if (topSpace > bottomSpace) {
                    //上面大，显示在上面
                    size = Math.min(Math.floor(topSpace / lineHeight), count);
                    top = topSpace - size * lineHeight - borderSize;
                    this.showTop = true;
                } else {
                    //否则，显示在下面
                    size = Math.min(Math.floor(bottomSpace / lineHeight), count);
                    top = topSpace + inputHeight;
                    this.showTop = false;
                }
            }
            //设置下拉狂样式
            if (size) {
                if (rightSpace + inputWidth > maxWidth) {
                    box.style.left = leftSpace + "px";
                    box.style.right = "auto";
                } else {
                    box.style.left = "auto";
                    box.style.right = rightSpace + "px";
                }
                box.style.top = top + "px";
                box.style.height = size * lineHeight + "px";
            }
            //返回可以显示有限的位置下多少条
            return {
                size : size,
                width: currEle.offsetWidth - borderSize
            };
        },
        /**
         * 获取下拉位置的参考元素，有边框的为参考元素
         * 因为input可能边框
         * @param ele
         * @returns {*}
         */
        getEeferenceEle: function (ele) {
            var i = 0;
            if (curBottomstyle(ele)) {
                return ele;
            }
            //查找有边框的父元素 3层
            for (; i < 3; i ++) {
                ele = ele.parentNode;
                if (curBottomstyle(ele)) {
                    return ele;
                }
            }
            return ele;
        },
        /**
         * 删除一条数据
         * @param index
         */
        removeData: function (index) {
            var data = this.data,
                list = this.list,
                v = this.text[index],
                newIndex,
                i, len,
                size = this.size = this.size - 1;
            if (!size) {
                //只有一条。删除隐藏
                this.hideBox();
            } else {
                this.inner.removeChild(list[index]);
                this.box.style.height = size * 25 + "px";
                if (this.index >= size) {
                    this.index --;
                }
                newIndex = this.index;
                list[newIndex].className = "kst-localautocomplete-checked";
                //更新index属性
                for (i = index; i < size; i++ ) {
                    list[i].setAttribute("index", i + "");
                }
                if (this.showTop) {
                    this.setLayout(size);
                }
            }
            this.text.splice(index, 1);
            //数据删除
            for (i = 0, len = data.length; i < len; i++ ) {
                if (data[i] === v) {
                    data.splice(i, 1);
                    break;
                }
            }
            autoCompleteData.set("data", data);
        },
        /**
         * 滚动和resize的时候下拉隐藏
         */
        positionChangeEvent: function () {
            var self = this, winWidth, winHeight;
            bind(win, "resize", function () {
                if (!self.isShow) {
                    return;
                }
                var width = window.innerWidth || html.clientWidth || body.clientWidth,
                    height = window.innerHeight || html.clientHeight || body.clientHeight;
                if (winWidth !== width || winHeight !== height ) {
                    //判断是否触发了 resize。因为IE下面，大小不变化也会触发resize
                    winWidth = width;
                    winHeight = height;
                    self.hideBox();
                }
            });
            //跟随滚动
            bind(win, "scroll", function () {
                if (!self.isShow) {
                    return;
                }
                self.setLayout(self.size);
            });
        }
    };
    //onload的500 ms时，触发。
    // 因为input可能是组件创建的，当时并不存在这个元素
    bind(win, "load", function () {
        setTimeout(function () {
            _localautocomplete.init();
        }, 500);
    });
})(window);
