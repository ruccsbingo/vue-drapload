(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) : (factory((global.Scroll = global.Scroll || {})))
}(this, function (exports) {
  'use strict'
  var throttle = function (fn, delay) {
    var now, lastExec, timer, context, args //eslint-disable-line

    var execute = function execute () {
      fn.apply(context, args)
      lastExec = now
    }

    return function () {
      context = this
      args = arguments

      now = Date.now()

      if (timer) {
        clearTimeout(timer)
        timer = null
      }

      if (lastExec) {
        var diff = delay - (now - lastExec)
        if (diff < 0) {
          execute()
        } else {
          timer = setTimeout(function () {
            execute()
          }, diff)
        }
      } else {
        execute()
      }
    }
  }

  /*
   默认状态
   下拉中
   到达预定位置
   加载

   默认状态
   加载更多
   暂无数据(不显示。没有数据可刷新)
   * */
  var getScrollTop = function (element) {
    if (element) {
      return element.scrollTop
    } else {
      return document.documentElement.scrollTop
    }
  }

  // css过渡
  function fnTransition (dom, num) {
    dom.style.transition = 'all ' + num + 'ms'
    dom.style.webkitTransform = 'all ' + num + 'ms'
  }

  /**
   * 获取可视区域高度
   * @returns {number}
   */
  var getVisibleHeight = function (element) {
    if (element) {
      return element.offsetHeight
    } else {
      return document.documentElement.offsetHeight
    }
  }

  /**
   * 获取滚动区域高度信息
   * @returns {number}
   */
  var getScrollHeight = function (element) {
    if (element) {
      return element.scrollHeight
    } else {
      return document.documentElement.scrollHeight
    }
  }

  /**
   * 判断该元素是否已经加入dom树
   * @param element
   * @returns {boolean}
   */
  var isAttached = function (element) {
    var currentNode = element.parentNode
    while (currentNode) {
      if (currentNode.tagName === 'HTML') {
        return true
      }
      if (currentNode.nodeType === 11) {
        return false
      }
      currentNode = currentNode.parentNode
    }
    return false
  }
  // touches
  function fnTouches (e) {
    if (!e.touches) {
      e.touches = e.originalEvent.touches
    }
  }

  // touchstart
  function fnTouchstart (e) {
    var me = this
    me._startY = e.touches[ 0 ].pageY
    // 记住触摸时的scrolltop值
    me.touchScrollTop = getScrollTop(me.element)
  }

  // touchmove
  function fnTouchmove (e) {
    var me = this
    var options = me._options
    var domUp = options.domUp
    me._curY = e.touches[ 0 ].pageY
    me._moveY = me._curY - me._startY

    if (me._moveY > 0) {
      me.direction = 'up'
    } else if (me._moveY < 0) {
      me.direction = 'down'
    }

    var _absMoveY = Math.abs(me._moveY)

    // 加载上方
    if (options.loadUpFn != ''
      && me.touchScrollTop <= 0
      && me.direction == 'up'
    ) {
      e.preventDefault()
      domUp.pullingCall(_absMoveY)

    }
  }

  // touchend
  function fnTouchend () {
    var me = this
    var options = me._options
    var domUp = options.domUp
    var _absMoveY = Math.abs(me._moveY)
    if (me.touchScrollTop <= 0
      && me.direction == 'up'
    ) {

      if (_absMoveY > options.domUp.distance) {
        domUp.dom.style.height = options.domUp.distance + "px"
        domUp.loadingCall()
        me.loading = true
        me.directive.vm.$get(options.loadUpFn)

      } else {
        domUp.dom.style.height = '0px'
      }
      me._moveY = 0
    }
  }

  var merge = function (org, aim) {
    for (var key in aim) {
      org[ key ] = aim[ key ]
    }
  }
  var Scroll = function (_directive) {
    var directive = _directive
    return {
      _options: {},

      _initConfig: function () {
        var me = this
        if (this.__initConfig) return
        this.__initConfig = true
        var element = directive.el
        me.directive = directive                                            // 滑动区域
        me.element = element                                            // 滑动区域
        me.isData = true
        me._options = {
          key: "scroll_" + parseInt(Math.random() * 10),
          domUp: {                                                            // 上方DOM
            dom: null,
            distance: 50,
            domClass: 'dropload-up',
            initialCall: function () {}, //初始化状态
            pullingCall: function () {}, //下拉过程中
            loadingCall: function () {},//加载中
            loadEndCall: function () {},//加载完成
          },
          domDown: {                                                          // 下方DOM
            dom: null,
            domClass: 'dropload-down',
            initialCall: function () {},//初始化
            loadingCall: function () {},
            domNoData: function () {},
            distance: 50
          },
          loadUpFn: '',                                                       // 上方function
          loadDownFn: ''                                                      // 下方function
        }
        merge(me._options.domUp, me.baseConfig.domUp)
        merge(me._options.domDown, me.baseConfig.domDown)

        //获取下拉刷新方法
        var key = element.getAttribute('scroll-key')
        if (key) {
          directive.vm[ key ] = me
          me._options.key = key
        }

        //获取下拉刷新方法
        me._options.loadUpFn = element.getAttribute('scroll-up')
        //获取下拉刷新方法
        me._options.loadDownFn = element.getAttribute('scroll-down')

      },
      _initDom: function () {

        var me = this
        if (this.__initDom) return
        this.__initDom = true
        var options = me._options
        var element = me.element
        var child = element.firstElementChild

        if (element.childElementCount != 1) {
          console.error("滚动元素最好只有一个孩子节点")
        } else {
          //绑定相关方法后才插入相关元素
          if (options.loadUpFn) {
            options.domUp.dom = document.createElement('div')
            options.domUp.dom.setAttribute("class", options.domUp.domClass)
            options.domUp.initialCall()
            element.insertBefore(options.domUp.dom, child)
            options.domUp.distance = options.domUp.dom.firstElementChild.clientHeight
          }
          if (options.loadDownFn) {
            options.domDown.dom = document.createElement('div')
            options.domDown.dom.setAttribute("class", options.domDown.domClass)
            options.domDown.initialCall()
            element.appendChild(options.domDown.dom)
            options.domDown.distance = options.domDown.dom.firstElementChild.clientHeight
          }
        }
      },
      _initEvent: function () {
        var me = this
        if (this.__initEvent) return
        this.__initEvent = true
        var element = me.element
        var options = me._options
        //绑定滚动事件
        if (options.loadUpFn) {
          // 绑定触摸

          me.touchstartCall = function (e) {
            if (!me.loading) {
              fnTouches.call(me, e)
              fnTouchstart.call(me, e)
            }
          }
          me.touchmoveCall = function (e) {
            if (!me.loading) {
              fnTouches.call(me, e)
              fnTouchmove.call(me, e)
            }
          }
          me.touchendCall = function () {
            if (!me.loading) {
              fnTouchend.call(me)
            }
          }
          element.addEventListener('touchmove', me.touchmoveCall)
          element.addEventListener('touchstart', me.touchstartCall)
          element.addEventListener('touchend', me.touchendCall)
        }
        if (options.loadDownFn) {
          me.scrollListener = throttle(me.doCheck.bind(me), 200)
          element.addEventListener('scroll', me.scrollListener)
        }

        //判断是否需要进入页面就开始检查一下数据是否需要加载。
        var initializeExpr = element.getAttribute('scroll-initialize')
        var initialize = false
        if (initializeExpr) {
          initialize = Boolean(directive.vm.$get(initializeExpr))
        }
        directive.initialize = initialize
        if (initialize) {
          me.doCheck()
        }
      },
      /**
       * 控制加载更多是否需要
       */
      noData: function () {
        var me = this
        me.isData = false
      },
      /**
       * 重置加载组件状态
       * @param noData 确认 没有数据
       */
      resetload: function () {
        var me = this
        var options = me._options
        me.loading = false
        if (me.direction == 'up') {
          options.domUp.dom.style.height = '0px'
          options.domUp.loadEndCall()
        } else {
          // 如果有数据
          if (me.isData) {
            // 加载区修改样式
            options.domDown.initialCall()
          } else {
            // 如果没数据
            options.loadDownFn = null
            options.domDown.domNoData()
          }
        }
      },
      doBind: function () {
        var me = this
        if (this.binded) return // eslint-disable-line
        this.binded = true

        //0:初始化配置参数
        me._initConfig()
        //1:添加元素到容器内部
        me._initDom()
        //2:绑定基础事件
        me._initEvent()
        // 设置滚动元素

      },
      doCheck: function (force) {
        var me = this
        console.log("key----", me._options.key)
        var element = me.element
        var options = me._options
        var downTrigger = getVisibleHeight(element) + getScrollTop(element) + 20 >= getScrollHeight(element)
        if (downTrigger && options.loadDownFn) {
          options.domDown.loadingCall()
          directive.vm.$get(options.loadDownFn)
        }
      },
      bind: function (config) {
        var me = this
        var element = directive.el
        me.baseConfig = config || {}
        // 判断文档是否加载插入dom对象，一直尝试。直到 加入dom对象树种
        directive.vm.$on('hook:ready', function () {
          if (isAttached(element)) {
            me.doBind()
          }
        })

        this.bindTryCount = 0

        var tryBind = function tryBind () {
          if (directive.bindTryCount > 10) return //eslint-disable-line
          directive.bindTryCount++
          if (isAttached(element)) {
            me.doBind()
          } else {
            setTimeout(tryBind, 50)
          }
        }
        tryBind()
      },
      unbind: function () {
        var me = this
        me.scrollListener && me.element.removeEventListener('scroll', me.scrollListener)
        me.touchstartCall && me.element.removeEventListener('touchstart', me.touchstartCall)
        me.touchmoveCall && me.element.removeEventListener('touchmove', me.touchmoveCall)
        me.touchendCall && me.element.removeEventListener('touchend', me.touchendCall)
        var key = me._options.key
        if (key) {
          delete directive.vm[ key ]
        }
      }
    }
  }

  // 基础配置信息
  var _config = {
    domUp: {                                                            // 上方DOM
      initialCall: function () {
        var me = this
        me.dom.innerHTML = '<div class="dropload-refresh">↓下拉刷新</div>'
      },
      loadingCall: function () {
        var me = this
        fnTransition(me.dom, 300)
        me.dom.innerHTML = '<div class="dropload-load"><span class="loading"></span>加载中...</div>'
      },
      loadEndCall: function () {
        var me = this
        me.dom.innerHTML = '<div class="dropload-load">加载完成</div>'
      },
      pullingCall: function (_absMoveY) {
        var me = this
        fnTransition(me.dom, 0)
        // 下拉
        if (_absMoveY <= me.distance) {
          me.initialCall()
          // 指定距离 < 下拉距离 < 指定距离*2
        } else if (_absMoveY > me.distance
          && _absMoveY <= me.distance * 2) {
          _absMoveY = me.distance + (_absMoveY - me.distance) * 0.5
          me.dom.innerHTML = '<div class="dropload-update">↑释放更新</div>'
          // 下拉距离 > 指定距离*2
        } else {
          _absMoveY = me.distance + me.distance * 0.5 + (_absMoveY - me.distance * 2) * 0.2
        }
        me.dom.style.height = _absMoveY + "px"
      }
    },
    domDown: {                                                          // 下方DOM
      initialCall: function () {
        var me = this
        me.dom.innerHTML = '<div class="dropload-refresh">加载更多</div>'
      },
      loadingCall: function () {
        var me = this
        me.dom.innerHTML = '<div class="dropload-load"><span class="loading"></span>加载中...</div>'
      },
      domNoData: function () {
        var me = this
        me.dom.innerHTML = ''
      },
    },
  }

  function install (Vue, config) {
    config = config||{}
    config.domUp && merge(_config.domUp, config.domUp)
    config.domDown && merge(_config.domDown, config.domDown)
    Vue.directive('Scroll', {
      bind: function () {
        var me = this
        me.scroll = new Scroll(me)
        me.scroll.bind(_config)
      },
      unbind: function () {
        var me = this
        me.scroll.unbind()
      }
    })
  }

  Scroll.install = install

  if (window.Vue) {
    window.Scroll = Scroll
    Vue.use(install)
  }

  exports.install = install
  exports.Scroll = Scroll

}))
