class MVVM {
  constructor(options) {
    this.$options = options || {}
    this.$data = this.$options.data

    if (this.$options.el) {
      //数据代理
      //vm.xxx -> vm.$data.xxx
      Object.keys(this.$data).forEach(key => {
        this.proxyData(key)
      })

      new Observer(this.$data)
      new Compile(this.$options.el || document.body, this)
    }
  }

  proxyData(key) {
    Object.defineProperty(this, key, {
      configurable: false,
      enumerable: true,
      get() {
        return this.$data[key]
      },
      set(newVal) {
        this.$data[key] = newVal
      }
    })
  }
}