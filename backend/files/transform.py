import pandas as pd

def main():
    data = pd.read_csv("./morocco_climate.csv")
    data = data[["region","latitude","longitude", "time", "precipitation", "snowfall", "apparent_temperature"]]
    
    # Convert time to datetime
    data['time'] = pd.to_datetime(data['time'])
    
    # Group by region and month, then calculate the mean
    data['year_month'] = data['time'].dt.to_period('M')
    monthly_avg = data.groupby(['region', 'year_month'])[['precipitation', 'snowfall', 'apparent_temperature']].mean()
    
    return monthly_avg

if __name__ == "__main__":
    result=main()
    result.to_csv("morocco_climate_monthly_averages.csv")
