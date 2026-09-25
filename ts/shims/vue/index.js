// A stub for the Vue entry points that malsync's provider code imports.
//
// The sync server never renders a Vue component. malsync's list code only
// reaches Vue in its frontend mode (`listAbstract` wraps the list in `reactive`
// when that is on, and the server leaves it off), so `reactive` is an identity
// function here.
//
// Everything else throws rather than returning nothing, because reaching one
// means something is trying to render: a silently missing component would look
// like an empty list, and that is the kind of bug this file exists to prevent.
// The declarations in `src/shim/modules.d.ts` are the typing side of the same
// stub.

function unsupported(name) {
  return function unavailable() {
    throw new Error(`vue: ${name} is not available in the sync server`);
  };
}

module.exports = {
  reactive: value => value,
  readonly: value => value,
  ref: unsupported('ref'),
  shallowRef: unsupported('shallowRef'),
  computed: unsupported('computed'),
  watch: unsupported('watch'),
  watchEffect: unsupported('watchEffect'),
  createApp: unsupported('createApp'),
  defineComponent: unsupported('defineComponent'),
  markRaw: value => value,
  toRefs: unsupported('toRefs'),
  h: unsupported('h'),
  nextTick: unsupported('nextTick'),
  onMounted: unsupported('onMounted'),
  onUnmounted: unsupported('onUnmounted'),
  onBeforeUnmount: unsupported('onBeforeUnmount'),
};
