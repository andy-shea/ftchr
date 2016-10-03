# ftchr

A small helper for fetch

## Install

```npm install ftchr --save```

## Example

```
import {get, post} from 'ftchr';

post('/api/foo', {bar: 'hello world'}) // posts to '/api/foo' with body {bar: 'hello world'}
get('/api/cars', {page: 2}) // get request to '/api/cars?page=2'
```

## Licence

[MIT](./LICENSE)
