const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")
const pkgConfig = require("../package.json")

const packageContent = ["package.json", "README.md", "LICENSE"]

console.log("Cleaning dist")
deleteRecursively("dist")

console.log("Building project")
try {
    execSync(pkgConfig.scripts.build, { stdio: "inherit" })
} catch (e) {
    process.exit(-1, e)
}

console.log("Deleting empty declarations")
deleteEmpties("dist")

console.log("Copying additional package contents")

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

function deleteRecursively(folder) {
    if (fs.existsSync(folder)) {
        fs.readdirSync(folder).forEach(entry => {
            entry = path.join(folder, entry)
            if (fs.lstatSync(entry).isDirectory()) {
                deleteRecursively(entry)
            } else {
                fs.unlinkSync(entry)
            }
        })
        fs.rmdirSync(folder)
    }
}
