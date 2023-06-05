// import { writeFile, readFile } from 'node:fs/promises'
// import { Buffer } from 'node:buffer'
// import { v4 as uuidv4 } from 'uuid'
//
// const writeTempEmail = async () => {
//     const email = `jon_snow-${uuidv4().slice(1, 6)}@mailinator.com`
//     const data = new Uint8Array(Buffer.from(email))
//     await writeFile('/tmp/email.txt', data, (err) => {
//         if (err) throw err
//         console.log('Test email saved')
//     })
//     return email
// }
//
// const readTempEmail = async (path) => {
//     await readFile(path, (err, data) => {
//         if (err) throw err
//         console.log(data)
//         return data
//     })
// }
//
// export { writeTempEmail, readTempEmail }