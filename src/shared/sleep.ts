export const sleep = (m: number) =>
  new Promise((res) =>
    setTimeout(() => {
      res('');
    }, m),
  );
