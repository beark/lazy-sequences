const fs = require("fs")
const path = require("path")

const packageContent = ["package.json", "README.md", "LICENSE"]

console.log("Preparing package contents")

packageContent.forEach(file => {
    console.log(path.resolve(file))
    fs.copyFileSync(file, path.join("dist", file))
})
