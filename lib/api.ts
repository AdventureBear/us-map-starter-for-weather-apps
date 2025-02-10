export interface WeatherDataParams {
  dataset: string;
  startDate: string;
  endDate: string;
  bbox?: string;
}

export class WeatherService {
  private baseUrl = 'https://www.ncdc.noaa.gov/swdiws';

  async fetchWeatherData({ dataset, startDate, endDate, bbox }: WeatherDataParams) {
    try {
      let url = `${this.baseUrl}/json/${dataset}/${startDate}:${endDate}`;
      
      if (bbox) {
        url += `?bbox=${bbox}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching weather data:', error);
      throw error;
    }
  }

  async getDatasetStats(dataset: string, startDate: string, endDate: string) {
    try {
      const url = `${this.baseUrl}/json/${dataset}/${startDate}:${endDate}?stat=count`;
      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  }
} 