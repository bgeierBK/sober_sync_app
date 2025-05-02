This is the codebase for SoberSync, an app designed to let people create sober spaces at concerts and other events.

## Dev Installation

You can find the package requirements necessary in `requirements.txt`. For development you may install with `pipenv install` and `pipenv shell` or `pip install` those packages yourself.

For generating a development database:

```bash
flask db upgrade
```

## `.env`

See the [sample-env](sample-env) for an idea of what to include in your `.env` file.