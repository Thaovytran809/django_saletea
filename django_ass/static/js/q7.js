document.addEventListener("DOMContentLoaded", function () {
  try {
    console.log("Dữ liệu ban đầu:", data);
    
    // Xử lý dữ liệu
    const clean_data = data.map((item) => ({
      ...item,
      created_date: item["Thoi_gian"] ? new Date(item["Thoi_gian"]) : null, // Chuyển đổi Date
      ma_ten_NH: `[${item["ma_NH"]}] ${item["ten_NH"]}`
    }));

    console.log("Cleaned data:", clean_data);

    // Vẽ biểu đồ
    drawChart7(clean_data);
  } catch (error) {
    console.error("Lỗi xử lý dữ liệu:", error);
  }
});


const drawChart7 = (data) => {
    
  
    // Đặt kích thước cho SVG
    const width = 1000;
    const height = 500;
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };
  
    const chartWidth = width - margin.left - margin.right - 450;
    const chartHeight = height - margin.top - margin.bottom;
  
    // Xử lý dữ liệu
    const total_order_id = d3.group(data, (d) => d["Bill_id"]);
        const groupedData = d3.rollups(
            data,
            (values) => {
                // đếm số order_id theo nhóm hàng
                const byOrder = d3.group(values, (d) => d["Bill_id"]);
                const xacsuat = (byOrder.size * 100) / total_order_id.size;
                const sldh = byOrder.size
                return { xacsuat, sldh };
            },
            (d) => d.ma_ten_NH
        );

        const processingData = Array.from(groupedData, ([ma_ten_NH, { xacsuat, sldh }]) => ({
            ma_ten_NH: ma_ten_NH,
            xacsuat: xacsuat,
            sl: sldh
        })).sort((a, b) => b.xacsuat - a.xacsuat);
  
    console.log("processingData:", processingData);
  
    // Tạo SVG
    const svg = d3
      .select("#q7")
      .attr("width", width)
      .attr("height", height);
  
    // Scales
    const xScale = d3
      .scaleLinear()
      .domain([0, d3.max(processingData, (d) => d.xacsuat)])
      .range([0, chartWidth]);
  
    const yScale = d3
      .scaleBand()
      .domain(processingData.map((d) => d.ma_ten_NH))
      .range([0, chartHeight])
      .padding(0.2);
  
  
    const colorScale = d3.scaleOrdinal(d3.schemeTableau10)
    .domain(processingData.map((d) => d.ma_ten_NH))
    

  
    // Dịch SVG
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left + 150},${margin.top})`);
  
    // Dịch trục
    g.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale).tickFormat((d) => `${(d).toFixed(0)}%`));
  
    g.append("g").call(d3.axisLeft(yScale));

    // Thêm các thanh cột
    g.selectAll(".bar")
      .data(processingData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", 0) // Thanh bắt đầu từ 0
      .attr("y", (d) => yScale(d.ma_ten_NH))
      .attr("width", (d) => xScale(d.xacsuat))
      .attr("height", yScale.bandwidth())
      .attr("fill", (d) => colorScale(d.ma_ten_NH))
      .on("mouseover", (event, d) => {
        // Hiển thị tooltip khi hover
        const tooltip = d3.select("#tooltip7");
        tooltip
          .style("opacity", 1)
          .html(
            `Nhóm hàng: ${d.ma_ten_NH}<br>Số lượng đơn bán: ${(d.sl)}<br>Xác suất bán: ${(d.xacsuat).toFixed(1)}%`
          )
          .style("left", `${event.pageX + 10}px`) // Vị trí tooltip theo chiều ngang
          .style("top", `${event.pageY - 28}px`); // Vị trí tooltip theo chiều dọc
      })
      .on("mouseout", () => {
        // Ẩn tooltip khi chuột ra khỏi thanh
        d3.select("#tooltip7").style("opacity", 0);
      })
    // Tiêu đề
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Xác suất bán hàng theo Nhóm hàng");
    // Thêm label
    g.selectAll(".label")
    .data(processingData)
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("x", (d) => xScale(d.xacsuat) + 5) // Cách thanh 5px
    .attr("y", (d) => yScale(d.ma_ten_NH) + yScale.bandwidth() / 2) // Căn giữa thanh
    .attr("dy", "0.35em") // Điều chỉnh để text thẳng hàng
    .attr("text-anchor", "start") // Căn trái
    .style("fill", "black") // Màu chữ
    .style("font-size", "12px") // Cỡ chữ
    .text((d) => (d.xacsuat).toFixed(1) + "%"); 

  };

