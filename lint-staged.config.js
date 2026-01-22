module.exports = {
  "*.{md,js,mjs,json}": "prettier --write",
  "*.ts": [() => "tsc --noEmit", "eslint --fix", "prettier --write"],
};
