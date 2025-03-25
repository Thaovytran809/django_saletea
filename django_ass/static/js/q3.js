document.addEventListener("DOMContentLoaded", function () {
  try {
    console.log("Dữ liệu ban đầu:", data);

    // Xử lý dữ liệu
    const clean_data = data.map((item) => ({
      ...item,
      created_date: item["Thoi_gian"] ? new Date(item["Thoi_gian"]) : null, // Chuyển đổi Date
      month: item["Thoi_gian"] 
        ? (new Date(item["Thoi_gian"]).getMonth() + 1).toString().padStart(2, '0') 
        : null
    }));

    console.log("Cleaned data:", clean_data);

    // Vẽ biểu đồ
    drawChart3(clean_data);
  } catch (error) {
    console.error("Lỗi xử lý dữ liệu:", error);
  }
});


const drawChart3 = (data) => {
    
  
    // Đặt kích thước cho SVG
    const width = 1100;
    const height = 500;
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };
  
    const chartWidth = width - margin.left - margin.right - 180;
    const chartHeight = height - margin.top - margin.bottom;
  
    // Xử lý dữ liệu
    const groupedData = d3.group(data, (d) => d.month);
    const processingData = Array.from(groupedData, ([key, value]) => ({
      month: key,
      total: d3.sum(value, (d) => d["total"] || 0),
      count: d3.sum(value, (d) => d["sL"] || 0),
    })).sort((a, b) => a.month - b.month);
  
    console.log("processingData:", processingData);
  
    // Tạo SVG
    const svg = d3
      .select("#q3")
      .attr("width", width)
      .attr("height", height);
  
    // Scales
    const xScale = d3
      .scaleBand()
      .domain(processingData.map((d) => `Tháng ${d.month}`))
      .range([0, chartWidth])
      .padding(0.2);
    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(processingData, (d) => d.total)])
      .range([chartHeight, 0]);
  
    const colorScale = d3.scaleOrdinal(d3.schemeSet2)
    .domain(processingData.map((d) => d.month))
    
    

  
    // Dịch SVG
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left + 150},${margin.top })`);
  
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
      .attr("x", (d) => xScale(`Tháng ${d.month}`))
      .attr("y", (d) => yScale(d.total))
      .attr("width", xScale.bandwidth())
      .attr("height", (d) => chartHeight - yScale(d.total))
      .attr("fill", (d) => colorScale(d.month))
      .on("mouseover", (event, d) => {
        // Hiển thị tooltip khi hover
        const tooltip = d3.select("#tooltip3");
        tooltip
          .style("opacity", 1)
          .html(
            `Tháng ${d.month}<br>Doanh số bán: ${(d.total / 1_000_000).toFixed(0)} triệu VNĐ<br>Số lượng bán: ${d.count} SKUs`
          )
          .style("left", `${event.pageX + 10}px`) // Vị trí tooltip theo chiều ngang
          .style("top", `${event.pageY - 28}px`); // Vị trí tooltip theo chiều dọc
      })
      .on("mouseout", () => {
        // Ẩn tooltip khi chuột ra khỏi thanh
        d3.select("#tooltip3").style("opacity", 0);
      })
    // Tiêu đề
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", margin.top / 2 - 10)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Doanh số bán hàng theo Tháng");
    
    // Thêm label cho mỗi cột
    g.selectAll(".label")
    .data(processingData)
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("x", (d) => xScale(`Tháng ${d.month}`) + xScale.bandwidth() / 2) // Đặt nhãn ở giữa cột
    .attr("y", (d) => yScale(d.total) - 5) // Đặt nhãn ở phía trên cột
    .attr("text-anchor", "middle") // Căn giữa nhãn
    .style("fill", "black") // Màu chữ
    .style("font-size", "10px") // Cỡ chữ
    .text((d) => (d.total / 1_000_000).toFixed(0) + " triệu VNĐ"); // Nội dung nhãn (tổng số)
    
  };

