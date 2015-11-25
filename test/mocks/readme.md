# Mocks
Simple create the path of the request as a folders below `datamanager`. Everything in `datamanager` will be mocked using `https://datamanager.entrecode.de/` Then you will need a file `<method>.<httpStatus>.<something-to-ignore>.json` with the following structure:

```json
{
    "qs": {
        "some": "awesome",
        "query": "strings"
    },
    "req": {
        "request": "body",
        "properties": "added",
    },
    "res": {
        "the": "response",
        "body": "here"
    },
}
```