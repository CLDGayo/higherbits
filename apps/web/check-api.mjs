fetch('https://codesandbox.io/api/v1/sandboxes/d5t2cg').then(res => res.text()).then(text => console.log(text.substring(0, 500)));
