import pandas as pd


def transform_csv_to_feather(csv_path, feather_path):
    data = pd.read_csv(csv_path)
    data.to_feather(feather_path)
    return feather_path


def main():
    data = pd.read_csv("../RAG/senegal_climate_with_coordinates.csv")
    data = data[["region", "latitude", "longitude", "time", "precipitation", "snowfall", "apparent_temperature"]]

    # Convert time to datetime
    data['time'] = pd.to_datetime(data['time'])

    # Group by region and month, then calculate the mean
    data['year_month'] = data['time'].dt.to_period('M')
    monthly_avg = data.groupby(['region', 'year_month'])[['precipitation', 'snowfall', 'apparent_temperature']].mean()

    return monthly_avg


if __name__ == "__main__":
    transform_csv_to_feather(
        "senegal_climate.csv",
        "senegal_climate.feather"
    )

