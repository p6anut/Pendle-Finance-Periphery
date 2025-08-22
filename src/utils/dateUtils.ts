export class DateUtils {
  // 生成从开始日期到今天的日期数组
  static getDatesFromStartToToday(startDate: Date): Date[] {
    const dates: Date[] = [];
    const currentDate = new Date();
    const start = new Date(startDate);
    
    // 重置时间为 00:00:00
    start.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);
    
    let date = new Date(start);
    
    while (date <= currentDate) {
      dates.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    
    return dates;
  }

  // 获取日期的午夜时间（UTC）
  static getMidnightTimestamp(date: Date): number {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return Math.floor(d.getTime() / 1000);
  }

  // 格式化日期为 YYYY-MM-DD
  static formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // 从日期字符串创建 Date 对象
  static parseDate(dateStr: string): Date {
    return new Date(dateStr + 'T00:00:00Z');
  }
}

