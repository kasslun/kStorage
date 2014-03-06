kStorage——本地存储框架
========
特性
--------
*    是一个轻量级的高效的javascript本地存储框架，即实现文本数据离线存储到浏览器端。
*   支持IE6+，Firefox，Chrame等PC端和移动端的浏览器。
*   kStorage不需要安装任何插件，只要引用一个.js文件便可实现本地存储功能。
*   kStorage实现了数据保存，查询，清除和过期管理，cookie模拟，存储查看器等功能。
*   kStorage以json格式保存数据，只要是json支持的数据类型，它都支持。
*   本地存储有大小限制，kStorage能自动清除过期的数据，一定程度上减缓其大小限制。
*   数据只当前域可读写。

如何使用
--------
支持IE6+以及其他主流浏览器引用kStorage.full.min.js。   
`<script src="kStorage.full.min.js" type="text/javascript"></script>`   
不需要支持IE6-7引用kStorage.min.js。   
`<script src="kStorage.min.js" type="text/javascript"></script>`   
开始使用   
```javascript
var myStorage = kst.use("myStorage");      
 myStorage.set("myName", "Jason");      
 myStorage.get("myName");
 ```

API、例子、以及说明请访问[http://kasslun.github.io/kStorage/index.html](http://kasslun.github.io/kStorage/index.html)
--------

