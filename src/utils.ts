const os = require('os')

const convertWinPath = (str: string) => str.replace(/\\/g, '/')
const pathToUnixPath = os.platform() === 'win32' ? convertWinPath : (str: string) => str

export { pathToUnixPath }
