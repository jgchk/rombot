import { login } from './login'
import { ping } from './ping'

export const commands = [ping, login]
export const commandMap = new Map(commands.map((command) => [command.data.name, command]))
