document.addEventListener("DOMContentLoaded", function () {
  try {
      console.log("Dữ liệu ban đầu:", data);

      // Xử lý dữ liệu
      const clean_data = data
          .map((item) => ({
              ...item,
              total: parseFloat(item?.total) || 0, // Chuyển total về dạng số an toàn
          }))
          .filter((item) => item.total > 0); // Lọc dữ liệu hợp lệ

      console.log("Cleaned data:", clean_data);

      // Nhóm dữ liệu theo mã khách hàng và tính tổng thành tiền
      const customerSpending = d3.rollups(
          clean_data,
          (v) => d3.sum(v, (d) => d.total), // Tính tổng thành tiền
          (d) => d?.["ma_KH"] || "Unknown" // Xử lý nếu thiếu mã khách hàng
      );

      // Chuyển đổi thành mảng { customer_id, total_amount }
      const spendingData = customerSpending.map(([customer_id, total_amount]) => ({
          customer_id,
          total_amount,
      }));

      console.log("Customer spending data:", spendingData);

      // Vẽ biểu đồ với spendingData
      drawChart12(spendingData);
  } catch (error) {
      console.error("Lỗi khi xử lý dữ liệu:", error);
  }
});


const drawChart12 = (data) => {
  const width = 1200;
  const height = 500;
  const margin = { top: 50, right: 50, bottom: 50, left: 50 };

  const chartWidth = width - margin.left - margin.right - 400;
  const chartHeight = height - margin.top - margin.bottom;

  // Tìm giá trị tối đa để xác định phạm vi bins
  const maxValue = d3.max(data, (d) => d.total_amount);

  // Xác định các bin có khoảng cách 50,000
  const binWidth = 50000;
  const binsRange = d3.range(0, maxValue + binWidth, binWidth);

  const xScale = d3
    .scaleLinear()
    .domain([0, maxValue]) 
    .range([0, chartWidth]);

  // Trục X
  const svg = d3
    .select("#q12")
    .attr("width", width)
    .attr("height", height);

  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left + 250},${margin.top})`);

  g.append("g")
    .attr("transform", `translate(0, ${chartHeight})`)
    .call(d3.axisBottom(xScale).tickFormat(d => d >= 1000 ? `${(d / 1000).toFixed(0)}K` : d));

  // Tạo histogram với binWidth = 50,000
  const histogram = d3
    .histogram()
    .value(d => d.total_amount)
    .domain(xScale.domain())
    .thresholds(binsRange);

  const bins = histogram(data);

  // Y scale dựa trên số lượng khách hàng trong mỗi bin
  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(bins, d => d.length)]) 
    .range([chartHeight, 0]);

  // Trục Y
  g.append("g").call(d3.axisLeft(yScale));

  // Vẽ histogram
  g.selectAll("rect")
    .data(bins)
    .enter()
    .append("rect")
    .attr("x", d => xScale(d.x0)) 
    .attr("y", d => yScale(d.length))
    .attr("height", d => chartHeight - yScale(d.length))
    .attr("width", xScale(binWidth) - 1) // Độ rộng cố định 50,000
    .attr("fill", "#4e79a7")
    .on("mouseover", (event, d) => {
      const tooltip = d3.select("#tooltip12");
      tooltip
        .style("opacity", 1)
        .html(`Đã chi tiêu Từ ${d.x0} đến ${d.x1}<br>Số lượng KH: ${d.length}`)
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 28}px`);
    })
    .on("mouseout", () => {
      d3.select("#tooltip12").style("opacity", 0);
    });

  // Tiêu đề
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Phân phối mức chi tiêu của khách hàng");
};
