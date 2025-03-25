document.addEventListener("DOMContentLoaded", function () {
  try {
    console.log("Dữ liệu ban đầu:", data);

    // Xử lý dữ liệu
    const clean_data = data.map((item) => ({
      ...item,
      created_date: item["Thoi_gian"] 
        ? new Date(item["Thoi_gian"]).toISOString().split("T")[0] 
        : null, // Chuyển đổi Date thành định dạng YYYY-MM-DD
      thu: item["Thoi_gian"] 
        ? new Date(item["Thoi_gian"]).getDay() 
        : null // Lấy thứ trong tuần (0: Chủ nhật, 1: Thứ Hai, ...)
    }));

    console.log("Cleaned data:", clean_data);

    // Vẽ biểu đồ
    drawChart4(clean_data);
  } catch (error) {
    console.error("Lỗi xử lý dữ liệu:", error);
  }
});


const drawChart4 = (data) => {
    
  
    // Đặt kích thước cho SVG
    const width = 1000;
    const height = 500;
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };
  
    const chartWidth = width - margin.left - margin.right - 180;
    const chartHeight = height - margin.top - margin.bottom -30;
  
    // Xử lý dữ liệu
    const thuMap = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
    const thuOrder = { "Thứ Hai": 0, "Thứ Ba": 1, "Thứ Tư": 2, "Thứ Năm": 3, "Thứ Sáu": 4, "Thứ Bảy": 5, "Chủ nhật": 6 };
    const groupedData = d3.rollups(
          d3.group(
              data.filter((d) => d.thu !== null), 
              (d) => d.created_date // Nhóm trước theo ngày cụ thể
          ),
          (values) => {
              const totalRNperDate = values.map(([date, item]) => ({
                  ngay: date,
                  total: d3.sum(item, (d) => d['total']),
                  count: d3.sum(item, (d) => d['sL']),
              }));
      
              const avgRN = d3.sum(totalRNperDate, (d) => d.total) / totalRNperDate.length;
              const avgSL = d3.sum(totalRNperDate, (d) => d.count) / totalRNperDate.length;
      
              return { avgRN, avgSL };
          },
          ([date, item]) => thuMap[new Date(date).getDay()] // Nhóm lại theo thứ sau khi đã nhóm theo ngày
      );
  
        
        const processingData = Array.from(groupedData, ([thu, { avgRN, avgSL }]) => ({
            thu: thu,
            TBDT: avgRN,
            TBSL: avgSL,
        })).sort((a, b) => thuOrder[a.thu] - thuOrder[b.thu]);

    console.log("processingData:", processingData);
  
    // Tạo SVG
    const svg = d3
      .select("#q4")
      .attr("width", width)
      .attr("height", height + 30);
  
    // Scales
    const xScale = d3
      .scaleBand()
      .domain(processingData.map((d) => d.thu))
      .range([0, chartWidth])
      .padding(0.2);
    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(processingData, (d) => d.TBDT)])
      .range([chartHeight, 0]);
  
    const colorScale = d3.scaleOrdinal(d3.schemeTableau10)
    .domain(processingData.map((d) => d.thu))
    
    

  
    // Dịch SVG
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left + 150},${margin.top  - 15})`);
  
    // Dịch trục
    g.append("g").call(d3.axisLeft(yScale).tickFormat(d3.format(".2s")));
    
    g.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale));

    // Thêm các thanh cột
    g.selectAll(".bar")
      .data(processingData)
      .enter()
      .append("rect")
      .attr("x", (d) => xScale(d.thu))
      .attr("y", (d) => yScale(d.TBDT))
      .attr("width", xScale.bandwidth())
      .attr("height", (d) => chartHeight - yScale(d.TBDT))
      .attr("fill", (d) => colorScale(d.thu))
      .on("mouseover", (event, d) => {
        // Hiển thị tooltip khi hover
        const tooltip = d3.select("#tooltip4");
        tooltip
          .style("opacity", 1)
          .html(
            `Ngày ${d.thu}<br>Doanh số bán TB: ${(d.TBDT).toFixed(0)} VNĐ<br>Số lượng bán TB: ${(d.TBSL).toFixed(0)} SKUs`
          )
          .style("left", `${event.pageX + 10}px`) // Vị trí tooltip theo chiều ngang
          .style("top", `${event.pageY - 28}px`); // Vị trí tooltip theo chiều dọc
      })
      .on("mouseout", () => {
        // Ẩn tooltip khi chuột ra khỏi thanh
        d3.select("#tooltip4").style("opacity", 0);
      })
    // Tiêu đề
    svg
      .append("text")
      .attr("x", width / 2 + 30)
      .attr("y", margin.top / 2 - 13)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Doanh số bán hàng trung bình theo Ngày trong tuần");
    
    // Thêm label cho mỗi cột
    g.selectAll(".label")
    .data(processingData)
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("x", (d) => xScale(d.thu) + xScale.bandwidth() / 2) // Đặt nhãn ở giữa cột
    .attr("y", (d) => yScale(d.TBDT) - 5) // Đặt nhãn ở phía trên cột
    .attr("text-anchor", "middle") // Căn giữa nhãn
    .style("fill", "black") // Màu chữ
    .style("font-size", "10px") // Cỡ chữ
    .text((d) => (d.TBDT).toFixed(0) + " VNĐ"); // Nội dung nhãn (tổng số)
    
  };

