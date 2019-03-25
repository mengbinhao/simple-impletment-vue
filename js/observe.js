class Observer {
  constructor(data) {
    this.$data = data
    this.observe(this.$data)
  }

  observe(data) {
  if (!data || typeof data !== 'object') return
    Object.keys(this.$data).forEach(key => {
      this.defineReactive(data, key, data[key])
    })
  }

  defineReactive(data, key, val) {
    let that = this
    //每个变化的数据都对应一个数组,这个数组存放所有更新的操作
    let dep = new Dep()

    Object.defineProperty(data, key, {
      configurable: false,
      enumerable: true,
      get() {
        Dep.target && dep.depend() //订阅
        return val
      },

      set(newVal) {
        if (newVal === val) return
          val = newVal
          that.observe(newVal) //新值是object继续observe
          dep.notify() //发布
        }
    })
  }
}

let uid = 0

class Dep {
  constructor() {
    this.id = uid++
    this.subs = []
  }

  addSub(sub) {
    this.subs.push(sub)
  }

  depend() {
    Dep.target.addDep(this)
  }

  removeSub(sub) {
    let index = this.subs.findIndex(sub)
    if (index !== -1) {
      this.subs.splice(index, 1)
    }
  }

  notify() {
    this.subs.forEach((sub) => {
      sub.update()
    })
  }
}