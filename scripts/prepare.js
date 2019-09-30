const fs = require("fs")
const path = require("path")

const packageContent = ["package.json", "README.md", "LICENSE"]

console.log("Deleting empty declarations")
deleteEmpties("dist")

console.log("Preparing package contents")

packageContent.forEach(file => {
    console.log(path.resolve(file))
    fs.copyFileSync(file, path.join("dist", file))
})

function deleteEmpties(folder) {
    const files = fs.readdirSync(folder)
    files.forEach(entry => {
        entry = path.join(folder, entry)
        if (entry.match(/\.d\.ts$/)) {
            const contents = fs.readFileSync(entry)
            if (contents.toString().match(/^export {};[\r\n]+$/)) {
                console.log(`- ${entry}`)
                fs.unlinkSync(entry)
            }
        } else if (fs.lstatSync(entry).isDirectory()) {
            deleteEmpties(entry)
        }
    })
}
