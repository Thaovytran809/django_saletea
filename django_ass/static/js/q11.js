document.addEventListener("DOMContentLoaded", function () {
  try {
      console.log("Dữ liệu ban đầu:", data);

      // Xử lý dữ liệu
      const clean_data = data.map((item) => ({
          ...item,
          created_date: item?.["Thoi_gian"] ? new Date(item["Thoi_gian"]) : null, // Chuyển đổi Date
      }));

      console.log("Cleaned data:", clean_data);

      // Vẽ biểu đồ
      drawChart11(clean_data);
  } catch (error) {
      console.error("Lỗi khi xử lý dữ liệu:", error);
  }
});


const drawChart11 = (data) => {
    
  
    // Đặt kích thước cho SVG
    const width = 1200;
    const height = 500;
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };
  
    const chartWidth = width - margin.left - margin.right - 400;
    const chartHeight = height - margin.top - margin.bottom;
  
    // Xử lý dữ liệu
      // Nhóm và đếm số lần mua của mỗi khách hàng
      const purchaseFrequency = d3.rollups(
        data,
        (v) => {
            const uniqueOrders = new Set(v.map(d => d["Bill_id"]));
            return uniqueOrders.size
        }, // Đếm số lần mua hàng
        (d) => d["ma_KH"] // Nhóm theo customer_id
      );

      // Chuyển đổi thành mảng { customer_id, count }
      const frequencyData = purchaseFrequency.map(([customer_id, count]) => ({
        customer_id,
        count,
      }));

      console.log("Frequency data:", frequencyData);
  
    // Tạo SVG
    const svg = d3
      .select("#q11")
      .attr("width", width)
      .attr("height", height);
  
    // Lấy danh sách số lần mua hàng (count)
    const counts = frequencyData.map((d) => d.count);
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left + 250},${margin.top})`);
  
    // Xác định miền cho trục X
    const xScale = d3
      .scaleLinear()
      .domain([0, d3.max(counts)]) // Miền dựa trên số lần mua lớn nhất
      .range([0, chartWidth]);

    // Tạo histogram
    const histogram = d3
      .histogram()
      .value((d) => d.count) // Tần suất mua
      .domain(xScale.domain())
      .thresholds(xScale.ticks(30)); // Chia thành 10 khoảng

    const bins = histogram(frequencyData);

    // Xác định miền cho trục Y (số lượng khách hàng)
    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(bins, (d) => d.length)]) // Số khách hàng trong mỗi bin
      .range([chartHeight, 0]);

    g.append("g").call(d3.axisLeft(yScale));
    
    g
      .append("g")
      .attr("transform", `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(xScale).ticks(10).tickValues(bins.map(bin => (bin.x0 + bin.x1) / 2)));

    // Vẽ các thanh của histogram
    g
      .selectAll("rect")
      .data(bins)
      .enter()
      .append("rect")
      .attr("x", (d) => xScale(d.x0-1))
      .attr("y", (d) => yScale(d.length))
      .attr("height", (d) => chartHeight - yScale(d.length))
      .attr("width", (d) => Math.max(0, xScale(d.x1) - xScale(d.x0) - 1)) // Đảm bảo không âm
      .attr("fill", "#4e79a7")
      .on("mouseover", (event, d) => {
        // Hiển thị tooltip khi hover
        const tooltip = d3.select("#tooltip11");
        tooltip
          .style("opacity", 1)
          .html(
            `Đã mua ${d.x0} lần<br>Số lượng KH: ${(d.length)}`
          )
          .style("left", `${event.pageX + 10}px`) // Vị trí tooltip theo chiều ngang
          .style("top", `${event.pageY - 28}px`); // Vị trí tooltip theo chiều dọc
      })
      .on("mouseout", () => {
        // Ẩn tooltip khi chuột ra khỏi thanh
        d3.select("#tooltip11").style("opacity", 0);
      })
    // Tiêu đề
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Phân phối lượt mua hàng");
  };

