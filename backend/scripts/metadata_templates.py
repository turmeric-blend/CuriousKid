template = {
    "name": "",
    "image": "",
    "attributes": [],
}

_opensea = {
    "name": "",
    "description": "",
    "image": "ipfs://<hash>/<name>.png",
    # "image_data": "< -- raw SVG image data to generate image on-the-fly | only use if 'image' keyword NOT used -- >",
    "external_url": "",  # This is the URL that will appear below the asset's image on OpenSea and will allow users to leave OpenSea and view the item on your site.
    "background_color": "",  # Background color of the item on OpenSea. Must be a six-character hexadecimal withOUT a pre-pended #.
    "animation_url": "",
    "youtube_url": "",
    "attributes": [
        {"value": "Happy"},
        {"trait_type": "Cuteness", "value": 100},
        {"trait_type": "Eyes", "value": "Big"},
        {"display_type": "boost_number", "trait_type": "Aqua Power", "value": 40},
        {
            "display_type": "boost_percentage",
            "trait_type": "Stamina Increase",
            "value": 10,
        },
        {"display_type": "number", "trait_type": "Generation", "value": 2},
        {
            "display_type": "date",
            "trait_type": "birthday",
            "value": 1546360800,
        }  # unix timestamp as "value"
        # for numeric traits, max_value is available
    ],
}


# reference: https://docs.opensea.io/docs/metadata-standards |
# ERC721: https://eips.ethereum.org/EIPS/eip-721
# Enjin's Metadata suggestions: https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1155.md#erc-1155-metadata-uri-json-schema
# Python Metadata References:
# https://github.com/ProjectOpenSea/opensea-creatures/blob/master/metadata-api/app.py
# https://github.com/ProjectOpenSea/metadata-api-python
