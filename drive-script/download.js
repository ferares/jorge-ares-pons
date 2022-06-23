const fs = require('fs')
const path = require('path')

const slugify = require('slugify')
const { google } = require('googleapis')

const apiKey = ''

const drive = google.drive({ version: 'v3', auth: apiKey })

const documentsData = fs.readFileSync('./documents.json')
const sections = JSON.parse(documentsData.toString())

function getFieldId(url) {
  return url.replace(/.*\/d\//, '').replace('/', '')
}

function saveDocument(data, documentTitle, extension, documentFolderPath) {
  const documentName = `${documentTitle}.${extension}`
  const documentPath = path.join(documentFolderPath, documentName)
  return fs.promises.writeFile(documentPath, data)
}

for (const section of sections) {
  const { documents } = section
  const sectionFolderPath = path.join('./', slugify(section.section))
  fs.mkdir(sectionFolderPath, () => {
    for (const document of documents) {
      const fileId = getFieldId(document.link)
      const documentName = slugify(document.title)
      drive.files.get({ fileId, fields: 'mimeType' }).then((response) => {
        const { mimeType } = response.data
        if (mimeType === 'application/vnd.google-apps.document') {
          drive.files.export({ fileId, mimeType: 'application/pdf' }, { responseType: 'arraybuffer' }).then((response) => {
            const data = Buffer.from(response.data)
            saveDocument(data, documentName, 'pdf', sectionFolderPath)
          })
        } else if (mimeType === 'application/msword') {
          drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' }).then((response) => {
            const data = Buffer.from(response.data)
            saveDocument(data, documentName, 'docx', sectionFolderPath)
          })
        } else if (mimeType === 'application/pdf') {
          drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' }).then((response) => {
            const data = Buffer.from(response.data)
            saveDocument(data, documentName, 'pdf', sectionFolderPath)
          })
        } else {
          console.error('Not supported format', mimeType)
        }
      }).catch((error) => console.error(error.response.data.error.message))
    }
  })
}

// for (const section of sections) {
//   const { documents } = section
//   console.log(slugify(section.section))
//   for (const document of documents) {
//     const fileId = getFieldId(document.link)
//     const documentName = slugify(document.title)
//     console.log(documentName)
//   }
//   console.log('')
// }
