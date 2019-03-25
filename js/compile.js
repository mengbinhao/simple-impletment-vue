class Compile {
  constructor(el, vm) {
    this.$vm = vm
    this.$el = this.isElement(el) ? el : document.querySelector(el)

    if (this.$el) {
      //el内容放到内存中
      this.$fragment = this.node2Fragment(this.$el)
      this.compile(this.$fragment)
      this.$el.appendChild(this.$fragment)
    }
  }

  isElement(node) {
    return node.nodeType === 1
  }

  isTextNode(node) {
    return node.nodeType == 3
  }

  isDirective(attr) {
    return attr.startsWith('v-')
  }

  isEventDirevtive(dir) {
    return dir.startsWith('on')
  }

  node2Fragment(el) {
    let fragment = document.createDocumentFragment()
    let child
    // 将原生节点拷贝到fragment
    while (child = el.firstChild) {
      fragment.append(child)
    }
    return fragment
  }

  compile(el) {
    let childNodes = el.childNodes
    Array.from(childNodes).forEach(node => {
      let reg = /\{\{\s*(\S+)\s*\}\}/g
      if (this.isElement(node)) {
        //compile element
        this.compileElement(node)
        this.compile(node)
        //{{a}} {{b}} {{c}}
      } else if (this.isTextNode(node) && reg.test(node.textContent)) {
        this.compileText(node, RegExp.$1)
      }

      //recusion
      // if (node.childNodes && node.childNodes.length) {
      //     this.compile(node)
      // }
    })
  }

  compileElement(node) {
    let nodeAttrs = node.attributes
    Array.from(nodeAttrs).forEach(attr => {
      let attrName = attr.name
      if (this.isDirective(attrName)) {
        let expr = attr.value
        let [, dir] = attrName.split('-')
        if (this.isEventDirevtive(dir)) {
          compileUtils.eventHandler(node, this.$vm, expr, dir)
          //normal directive
        } else {
          compileUtils[dir] && compileUtils[dir](node, this.$vm, expr)
        }
        node.removeAttribute(attrName)
      }
    })
  }

  compileText(node, expr) {
    compileUtils['text'](node, this.$vm, expr)
  }
}


// 指令处理集合
let compileUtils = {
  bind(node, vm, expr, dir) {
    let updateFn = updater[dir + 'Updater']
    //{{ message.a.b }}
    updateFn && updateFn(node, this.getVMVal(vm, expr))

    //增加监控
    //has bug  {{ message }} {{ message }}
    new Watcher(vm, expr, function(value, oldValue) {
      updateFn && updateFn(node, value, oldValue)
    })
  },

  eventHandler(node, vm, exp, dir) {
    let eventType = dir.split(':')[1]
    fn = vm.$options.methods && vm.$options.methods[exp]
    if (eventType && fn) {
      node.addEventListener(eventType, fn.bind(vm), false)
    }
  },

  getVMVal(vm, expr) {
    // let val = vm
    // let exprs = expr.split('.')
    // exprs.forEach(k => {
    //     val = val[k.trim()]
    // })
    // return val
    return expr.split('.').reduce((acc, cur) => {
      return acc[cur]
    }, vm.$data)
  },

  setVMVal(vm, expr, value) {
    // let val = vm
    //     exps = exp.split('.')
    // exps.forEach((k, i) => {
    //   //非最后一个key,更新val值
    //   if (i < exps.length - 1) {
    //     val = val[k]
    //   } else {
    //     val[k] = value
    //   }
    // })
    let exprs = expr.split('.')
    return exprs.reduce((acc, cur, index) => {
      console.log(index)
      if (index === exprs.length - 1) {
        return acc[cur] = value
      }
      return acc[cur]
    }, vm.$data)
  },

  model(node, vm, exp) {
    this.bind(node, vm, exp, 'model')

    let val = this.getVMVal(vm, exp)

    node.addEventListener('input', (e) => {
      let newVal = e.target.value
      if (val === newVal) return
      this.setVMVal(vm, exp, newVal)
      val = newVal
    })
  },

  text(node, vm, expr) {
    this.bind(node, vm, expr, 'text')
  },

  html: function(node, vm, exp) {
    this.bind(node, vm, exp, 'html')
  },

  class: function(node, vm, exp) {
    this.bind(node, vm, exp, 'class')
  }
}

let updater = {
  textUpdater(node, value) {
    node.textContent = typeof value === 'undefined' ? '' : value
  },

  modelUpdater(node, value) {
    node.value = typeof value === 'undefined' ? '' : value
  },

  htmlUpdater: function(node, value) {
    node.innerHTML = typeof value == 'undefined' ? '' : value
  },

  classUpdater: function(node, value, oldValue) {
    var className = node.className
    className = className.replace(oldValue, '').replace(/\s$/, '')

    var space = className && String(value) ? ' ' : ''

    node.className = className + space + value
  },

  modelUpdater: function(node, value, oldValue) {
    node.value = typeof value == 'undefined' ? '' : value
  }
}