from collections import Counter
import numpy as np
import itertools
import random
import matplotlib.pyplot as plt
import glob
from PIL import Image, ImageDraw
import os
import metadata_templates as mt
import json
import imageio

HIDDEN_PARAMS = {"name": "hidden", "description": "Content Hidden"}
GATEWAY_PINATA = "https://gateway.pinata.cloud/ipfs/{CID}/{FILE}"
GATEWAY_NFT_STORAGE = "https://{CID}.ipfs.dweb.link/{FILE}"

VISUAL_COLOURS = [
    "#e6194B",
    "#f58231",
    "#ffe119",
    "#bfef45",
    "#3cb44b",
    "#42d4f4",
    "#4363d8",
    "#911eb4",
    "#f032e6",
    "#a9a9a9",
    "#800000",
    "#9A6324",
    "#000075",
    "#fffac8",
    "#000000",
]  # for visuals


def RGC_without_repetition(
    base_attributes, attributes, attributes_prob, pool_size=None, plot=False
):
    """
    similar to Crypto Punks

    eg.
    base_attributes = {"Rectangle": 9, "Ellipse": 5, "X": 2}
    attributes = {
        0: ["#e6194B", "#469990", "#dcbeff"],  # hexagon
        1: ["#bfef45", "#911eb4", "#000000", "#aaffc3", "#f58231", "#f032e6"],  # chord
        2: ["#ffd8b1", "#42d4f4"],  # square
        3: ["#ffffff", "#3cb44b", "#ffe119", "#4363d8"],  # triangle
    }
    attributes_prob = {
        0: [0.71, 0.26, 0.03],
        1: [0.37, 0.27, 0.16, 0.11, 0.07, 0.02],
        2: [0.95, 0.05],
        3: [0.75, 0.15, 0.05, 0.05],
    }
    """
    site_key_map = {}
    for idx, ((title1, attrs), (title2, probs)) in enumerate(zip(attributes.items(), attributes_prob.items())):
        assert title1 == title2
        assert len(attrs) == len(probs)
        assert sum(probs) == 1.0
        site_key_map[idx] = title1
        # print(f"# ----- {title1} ----- #")
        # for attr, prob in zip(attrs, probs):
        #     print(f"{attr}: {prob}")

    base_attr_keys = list(base_attributes.keys())

    num_sites = len(attributes)

    for site, prob in attributes_prob.items():
        assert sum(prob) == 1.0

    if isinstance(pool_size, type(None)):
        pool_size = int(2 ** num_sites)
    assert pool_size <= 2 ** num_sites

    bases = []
    for base_attr_key in base_attr_keys:
        assert sum(base_attributes[base_attr_key].values()) == pool_size
        base_attributes_list = []
        for k, v in base_attributes[base_attr_key].items():
            base_attributes_list.extend([k] * v)
        random.shuffle(base_attributes_list)
        bases.append(base_attributes_list)

    combos = list(powerset(range(num_sites)))
    random.shuffle(combos)
    assert len(combos) == len(set(combos)), "non-unique"
    print(len(combos), "initial generation choices")

    pool = list(np.random.choice(combos, p=None, size=pool_size, replace=False))
    assert len(pool) == len(set(pool)), "non-unique"
    print(len(pool), "final pool choices")

    pool_new = []
    for sites in pool:
        sites_new = []
        for site in sites:
            attribute = np.random.choice(attributes[site_key_map[site]], p=attributes_prob[site_key_map[site]])
            sites_new.append(attribute)
        pool_new.append(tuple(sites_new))
    assert len(pool_new) == len(set(pool_new)), "non-unique"
    print(len(pool_new), "final pool choices w/ attributes")

    assert len(pool_new) == len(base_attributes_list)
    final_dict = {}
    for idx, (attr_base1, attr_base2, attr_main) in enumerate(zip(bases[0], bases[1], pool_new)):
        final_dict[idx] = [attr_base1, attr_base2, attr_main]

    final_dict_keys = list(final_dict.keys())
    final_dict_base_length_total = len(str(len(final_dict)))

    for key in final_dict_keys:
        key_str_length = len(str(key))
        key_additional = final_dict_base_length_total - key_str_length
        key_new = ("0" * key_additional) + str(key)

        final_dict[key_new] = final_dict.pop(key)

    if plot:
        plot_RGCwithoutRepetition(final_dict, attributes, pool_size)

    return final_dict


def generate_final_images_from_layers(final_dict, path_base, path_base2, path_sites, path_output):
    """image path must be of the form
    --data
        --images
            --final
                0000.png
                0001.png
                ...
                0099.png
            --hidden
                hidden.png
            --layers
                --base
                    base_name1.png
                    base_name2.png
                --sites
                    --site_0
                        base_nameX.png
                        base_nameY.png
                    --site_1
                        ...
        --metadata
            --final
            --hidden
    """
    files = glob.glob(f"{path_output}/*.png")
    if len(files) == 0:
        attr_files = glob.glob(
            f"{path_sites}/**/*.png", recursive=True
        )  # list of files ending in .png
        for idx, attributes in final_dict.items():
            base = Image.open(f"{path_base}/{attributes[0]}.png").convert("RGBA")
            base2 = Image.open(f"{path_base2}/{attributes[1]}.png").convert("RGBA")
            base.paste(base2, (0, 0), base2)
            for attribute in attributes[-1]:
                for attr_filname in attr_files:
                    attr_name = attr_filname.split("/")[-1][:-4]
                    if attr_name == attribute:
                        attr = Image.open(attr_filname).convert("RGBA")
                        base.paste(attr, (0, 0), attr)
            base.save(f"{path_output}/{idx}.png")
    else:
        print(
            f"{path_output} folder contains files, delete them before u generate new ones!"
        )


def generate_gif_from_images(path_images, path_gifs):
    frames = [imageio.imread(f) for f in sorted(glob.glob(f"{path_images}/*.png"))]
    imageio.mimsave(path_gifs, frames, format='GIF', fps=1)


def generate_metadata(
    hash, final_dict, base_attributes, attributes, path_image, path_metadata, hidden=False
):
    metadata_dict = mt.template
    # pathlib.Path(f"./{path_metadata}").mkdir(parents=True, exist_ok=True)

    for file in os.listdir(path_image):

        if hidden:
            name = HIDDEN_PARAMS["name"]
            metadata_dict["name"] = name
            metadata_dict["image"] = GATEWAY_NFT_STORAGE.format(CID=hash, FILE=file) # f"{GATEWAY_PINATA}{hash}/{file}"
            metadata_dict["attributes"] = []
        else:
            name = file.split(".")[0]

            attr_list = []
            for attrs in final_dict[name]:
                if not isinstance(attrs, tuple):
                    for folder, images in base_attributes.items():
                        for name_, v in images.items():
                            if attrs == name_:
                                attr_list.append({"trait_type": folder, "value": attrs.split("_")[0]})
                else:
                    for attr in attrs:
                        for folder, images in attributes.items():
                            for name_ in images:
                                if attr == name_:
                                    attr_list.append({"trait_type": folder, "value": attr.split("_")[0]})
            metadata_dict["name"] = name
            metadata_dict["image"] = GATEWAY_NFT_STORAGE.format(CID=hash, FILE=file)
            metadata_dict["attributes"] = attr_list

        with open(f"{path_metadata}/{name}.json", "w") as file:
            json.dump(metadata_dict, file)


# # # # # # # # # # # # # # # # # # #
# # # # # ----------------- # # # # #
# # # # # ----- utils ----- # # # # #
# # # # # ----------------- # # # # #
# # # # # # # # # # # # # # # # # # #


def powerset(iterable):
    """
    powerset([1,2,3]) --> () (1,) (2,) (3,) (1,2) (1,3) (2,3) (1,2,3)
    # in total, produces equal number of each item from the iterable
    # for the above example,
    # count of 1 is 4
    # count of 2 is 4
    # count of 3 is 4
    """
    s = list(iterable)
    return itertools.chain.from_iterable(
        itertools.combinations(s, r) for r in range(len(s) + 1)
    )


def flatten(listOfLists):
    "Flatten one level of nesting"
    return itertools.chain.from_iterable(listOfLists)


def plot_RGCwithoutRepetition(final_dict, attributes, pool_size):
    num_sites = len(attributes)
    colour_code_attr = VISUAL_COLOURS[:num_sites]  # for visuals

    list_main = list(final_dict.values())
    list_tmp = [lst[0] for lst in list_main]
    assert len(list_tmp) == pool_size
    plt.figure(figsize=(26, 10))
    base_attr_dict = dict(Counter(list_tmp).most_common()[::-1])
    plt.bar(base_attr_dict.keys(), base_attr_dict.values())
    plt.xticks(rotation=45)
    plt.title("Base Attr Counts | Total: " + str(sum(base_attr_dict.values())))
    plt.xlabel("Base Attributes")
    plt.ylabel("Count")
    for k, v in base_attr_dict.items():
        plt.text(x=k, y=v, s=f"{v}", fontdict=dict(fontsize=20))

    list_main = list(final_dict.values())
    list_tmp = [lst[1] for lst in list_main]
    dist_items = dict(Counter(list(flatten(list_tmp))))
    plt.figure(figsize=(26, 10))
    bars = plt.bar(dist_items.keys(), dist_items.values())
    plt.title("Total Attributes: " + str(sum(dist_items.values())))  # TODO: this wrong
    plt.xlabel("Attributes")
    plt.ylabel("Count")
    for k, v in dist_items.items():
        plt.text(x=k, y=v, s=f"{v}", fontdict=dict(fontsize=10))
    for bar, (attr, count) in zip(bars, dist_items.items()):
        for site, attr_ori in attributes.items():
            if attr in attr_ori:
                bar.set_color(colour_code_attr[site])

    list_main = list(final_dict.values())
    list_tmp = [lst[1] for lst in list_main]
    combo_dict = {}
    for combo in list_tmp:
        num_attributes = len(combo)
        if num_attributes in combo_dict.keys():
            combo_dict[num_attributes] += 1
        else:
            combo_dict[num_attributes] = 1
    assert sum(combo_dict.values()) == pool_size
    combo_items = combo_dict.items()
    combo_dict_new = dict(sorted(combo_items))
    assert sum(combo_dict_new.values()) == pool_size

    plt.figure(figsize=(26, 10))
    plt.bar(combo_dict_new.keys(), combo_dict_new.values())
    plt.title("Attribute Counts | Total: " + str(sum(combo_dict_new.values())))
    plt.xticks(list(combo_dict_new.keys()))
    plt.xlabel("Art with Number of Attributes")
    plt.ylabel("Count")
    for k, v in combo_dict_new.items():
        plt.text(x=k, y=v, s=f"{v}", fontdict=dict(fontsize=20))
    plt.show()
