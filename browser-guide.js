export function createBrowserGuide(updateStatus) {
  let worker;
  let cancelRequest;

  function stop() {
    if (worker) worker.terminate();
    worker = undefined;
  }

  function ask(input) {
    if (cancelRequest) return Promise.reject(new Error('rate-limit'));
    return new Promise((resolve, reject) => {
      worker ??= new Worker(new URL('./browser-guide-worker.js', import.meta.url), { type: 'module' });
      const activeWorker = worker;

      function finish() {
        clearTimeout(deadline);
        activeWorker.removeEventListener('message', receive);
        activeWorker.removeEventListener('error', unavailable);
        activeWorker.removeEventListener('messageerror', unavailable);
        cancelRequest = undefined;
      }

      function fail(reason) {
        finish();
        stop();
        reject(new Error(reason));
      }

      function unavailable() {
        fail('unavailable');
      }

      function receive({ data }) {
        if (data.status) {
          updateStatus(data.status);
          return;
        }
        finish();
        resolve(data.answer);
      }

      const deadline = setTimeout(unavailable, 180_000);
      cancelRequest = () => fail('cancelled');
      activeWorker.addEventListener('message', receive);
      activeWorker.addEventListener('error', unavailable);
      activeWorker.addEventListener('messageerror', unavailable);
      try {
        activeWorker.postMessage(input);
      } catch {
        unavailable();
      }
    });
  }

  function cancel() {
    if (cancelRequest) cancelRequest();
    else stop();
  }

  return { ask, cancel };
}
