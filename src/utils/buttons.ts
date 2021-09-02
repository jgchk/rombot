import EventEmitter from 'events'
import { ButtonInteraction, MessageButton } from 'discord.js'
import { nanoid } from 'nanoid'
import StrictEventEmitter from 'strict-event-emitter-types'

type Events = { [key: string]: ButtonCallback }
type ButtonCallback = (interaction: ButtonInteraction) => void | Promise<void>

const buttonEmitter: StrictEventEmitter<EventEmitter, Events> =
  new EventEmitter()

export const subscribeButton = (
  button: MessageButton,
  interactionCallback: ButtonCallback
): MessageButton => {
  const id = getFreshId()
  button.setCustomId(id)

  const listener = (interaction: ButtonInteraction) =>
    void interactionCallback(interaction)
  buttonEmitter.on(id, listener)

  return button
}

export const unsubscribeButton = (button: MessageButton): void => {
  const id = button.customId
  if (id !== null) buttonEmitter.removeAllListeners(id)
}
export const unsubscribeButtons = (...buttons: MessageButton[]): void => {
  for (const button of buttons) {
    unsubscribeButton(button)
  }
}

export const emitButton = (interaction: ButtonInteraction): void => {
  const id = interaction.customId
  buttonEmitter.emit(id, interaction)
}

const getFreshId = (): string => {
  let id = nanoid()
  while (buttonEmitter.listenerCount(id) !== 0) {
    id = nanoid()
  }
  return id
}
