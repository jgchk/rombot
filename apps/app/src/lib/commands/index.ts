import { login } from './login'
import { ping } from './ping'
import { setUsername } from './set-username'

export const commands = [ping, setUsername]
export const commandMap = new Map(commands.map((command) => [command.data.name, command]))

export const oldCommands = [login]
