import json

# Add encoding="utf-8" to handle reading non-ASCII characters correctly
with open("../../data/raw/crop_growth_time.json", "r", encoding="utf-8") as f:
    growth_crops = json.load(f)

with open("../../data/processed/crops_merged.json", "r", encoding="utf-8") as f:
    main_crops = json.load(f)
    for main_crop in main_crops:
        main_crop_name = main_crop["crop_name"]
        for crop in growth_crops:
            crop_name = crop["crop"]
            if main_crop_name == crop_name:
                main_crop["growth_time"] = crop["sowing_to_first_harvest_days"]

# Add encoding="utf-8" and ensure_ascii=False to write human-readable characters
with open("./output.json", "w", encoding="utf-8") as f:
    json.dump(main_crops, f, indent=2, ensure_ascii=False)
