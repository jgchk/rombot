<script lang="ts">
  import { fetchChart } from 'commands'
  import { superForm } from 'sveltekit-superforms/client'
  import { fetcher } from 'utils/browser'

  import type { PageData } from './$types'

  export let data: PageData

  // Client API:
  const { form, errors, constraints, enhance, capture, restore, reset } = superForm(data.form, {
    dataType: 'json',
    resetForm: false,
    onUpdate: async ({ form }) => {
      if (form.valid) {
        // fetch chart
        const result = await fetchChart(fetcher())(form.data)

        // Download chart
        const a = document.createElement('a')
        a.href = URL.createObjectURL(result)
        a.download = 'chart.png'
        a.click()
        a.remove()
      }
    },
  })

  export const snapshot = { capture, restore }

  function addEntry() {
    $form.entries = [...$form.entries, { title: '', artist: '' }]
  }
</script>

<form method="POST" use:enhance>
  <fieldset>
    <legend>Chart Entries</legend>
    {#each $form.entries as entry, index (index)}
      <div>
        <h4>Entry {index + 1}</h4>
        <label>
          Artist:
          <input
            type="text"
            bind:value={entry.artist}
            data-invalid={$errors.entries?.[index].artist}
            {...$constraints.entries?.artist}
          />
          {#if $errors.entries?.[index].artist}<span class="invalid"
              >{$errors.entries[index].artist}</span
            >{/if}
        </label>
        <label>
          Title:
          <input
            type="text"
            bind:value={entry.title}
            data-invalid={$errors.entries?.[index].title}
            {...$constraints.entries?.title}
          />
          {#if $errors.entries?.[index].title}<span class="invalid"
              >{$errors.entries[index].title}</span
            >{/if}
        </label>
        <label>
          Rating:
          <input
            type="number"
            bind:value={entry.rating}
            data-invalid={$errors.entries?.[index].rating}
            {...$constraints.entries?.rating}
          />
          {#if $errors.entries?.[index].rating}<span class="invalid"
              >{$errors.entries[index].rating}</span
            >{/if}
        </label>
        <label>
          Image URL:
          <input
            type="url"
            bind:value={entry.imageUrl}
            data-invalid={$errors.entries?.[index].imageUrl}
            {...$constraints.entries?.imageUrl}
          />
          {#if $errors.entries?.[index].imageUrl}<span class="invalid"
              >{$errors.entries[index].imageUrl}</span
            >{/if}
        </label>
      </div>
    {/each}
    <button type="button" on:click={addEntry}>Add Entry</button>
  </fieldset>
  <fieldset>
    <legend>Chart Configuration</legend>
    <label>
      Rows:
      <input
        type="number"
        placeholder="Auto"
        bind:value={$form.rows}
        data-invalid={$errors.rows}
        {...$constraints.rows}
      />
      {#if $errors.rows}<span class="invalid">{$errors.rows}</span>{/if}
    </label>
    <label>
      Columns:
      <input
        type="number"
        placeholder="Auto"
        bind:value={$form.cols}
        data-invalid={$errors.cols}
        {...$constraints.cols}
      />
      {#if $errors.cols}<span class="invalid">{$errors.cols}</span>{/if}
    </label>
    <label>
      Cover size:
      <input
        type="number"
        placeholder="300"
        bind:value={$form.coverSize}
        data-invalid={$errors.coverSize}
        {...$constraints.coverSize}
      />
      {#if $errors.coverSize}<span class="invalid">{$errors.coverSize}</span>{/if}
    </label>
  </fieldset>
  <button type="submit">Submit</button>
  <button type="reset" on:click={() => reset()} style="float: right;">Reset</button>
</form>

<style>
  .invalid {
    color: red;
  }
</style>
