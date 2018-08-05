

router.post('/', upload.fields([ { name: 'thumbnail' } ]), function(req, res, next) {
  console.log(req.files); // req.filesにアップロードされたデータが入ってきます。
}